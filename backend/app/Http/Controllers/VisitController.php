<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use App\Models\Visit;
use App\Models\PfLedger;
use App\Models\PensionLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VisitController extends Controller
{
    public function index(Executive $executive)
    {
        $visits = $executive->visits()->orderBy('visit_date', 'desc')->get();
        return response()->json($visits);
    }

    public function store(Request $request, Executive $executive)
    {
        $validated = $request->validate([
            'visit_date'           => 'required|date',
            'charity_collection'   => 'numeric|min:0',
            'orphanage_collection' => 'numeric|min:0',
            'khidma_collection'    => 'numeric|min:0',
            'charity_expense'      => 'numeric|min:0',
            'orphanage_expense'    => 'numeric|min:0',
            'khidma_expense'       => 'numeric|min:0',
            'fixed_salary'         => 'numeric|min:0',
            'pension'              => 'numeric|min:0',
            'notes'                => 'nullable|string',
        ]);

        // Calculates
        $totalCollection = ($validated['charity_collection'] ?? 0) +
                           ($validated['orphanage_collection'] ?? 0) +
                           ($validated['khidma_collection'] ?? 0);

        $totalExpense = ($validated['charity_expense'] ?? 0) +
                        ($validated['orphanage_expense'] ?? 0) +
                        ($validated['khidma_expense'] ?? 0);

        $calculatedSalary = $this->calculateAllowance($totalCollection);

        $pf = $totalExpense - ($validated['fixed_salary'] ?? 0) - ($validated['pension'] ?? 0);
        $netBalance = $totalCollection - $totalExpense;

        $visitData = array_merge($validated, [
            'total_collection'  => $totalCollection,
            'total_expense'     => $totalExpense,
            'pf'                => $pf,
            'net_balance'       => $netBalance,
            'calculated_salary' => $calculatedSalary,
        ]);

        DB::beginTransaction();

        try {
            $visit = $executive->visits()->create($visitData);

            // Update Executive balances
            $executive->increment('pf_balance', $pf);
            $executive->increment('pension_balance', $validated['pension'] ?? 0);

            // Create Ledger Entries
            if ($pf != 0) {
                PfLedger::create([
                    'executive_id' => $executive->id,
                    'visit_id'     => $visit->id,
                    'date'         => $visit->visit_date,
                    'type'         => 'accrual',
                    'description'  => 'Daily Report Accrual',
                    'amount'       => $pf,
                ]);
            }

            if (($validated['pension'] ?? 0) != 0) {
                PensionLedger::create([
                    'executive_id' => $executive->id,
                    'visit_id'     => $visit->id,
                    'date'         => $visit->visit_date,
                    'type'         => 'accrual',
                    'description'  => 'Daily Report Pension Deduction',
                    'amount'       => $validated['pension'],
                ]);
            }

            DB::commit();

            return response()->json($visit, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save visit', 'details' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Executive $executive, Visit $visit)
    {
        // Validation similar to store
        $validated = $request->validate([
            'visit_date'           => 'required|date',
            'charity_collection'   => 'numeric|min:0',
            'orphanage_collection' => 'numeric|min:0',
            'khidma_collection'    => 'numeric|min:0',
            'charity_expense'      => 'numeric|min:0',
            'orphanage_expense'    => 'numeric|min:0',
            'khidma_expense'       => 'numeric|min:0',
            'fixed_salary'         => 'numeric|min:0',
            'pension'              => 'numeric|min:0',
            'notes'                => 'nullable|string',
        ]);

         $totalCollection = ($validated['charity_collection'] ?? 0) +
                           ($validated['orphanage_collection'] ?? 0) +
                           ($validated['khidma_collection'] ?? 0);

        $totalExpense = ($validated['charity_expense'] ?? 0) +
                        ($validated['orphanage_expense'] ?? 0) +
                        ($validated['khidma_expense'] ?? 0);

        $calculatedSalary = $this->calculateAllowance($totalCollection);

        $pf = $totalExpense - ($validated['fixed_salary'] ?? 0) - ($validated['pension'] ?? 0);
        $netBalance = $totalCollection - $totalExpense;

        $visitData = array_merge($validated, [
            'total_collection'  => $totalCollection,
            'total_expense'     => $totalExpense,
            'pf'                => $pf,
            'net_balance'       => $netBalance,
            'calculated_salary' => $calculatedSalary,
        ]);

        DB::beginTransaction();

        try {
            // Calculate Deltas
            $pfDelta = $pf - $visit->pf;
            $pensionDelta = ($validated['pension'] ?? 0) - $visit->pension;

            $visit->update($visitData);

            $executive->increment('pf_balance', $pfDelta);
            $executive->increment('pension_balance', $pensionDelta);

            // Here we would typically adjust or re-create ledger entries. For simplicity in migration, 
            // if you edit a visit it might be complex to find the exact ledger. Let's assume we update the specific ledgers.
            // Simplified approach: find ledgers by visit_id and update.
            $pfLedger = PfLedger::where('visit_id', $visit->id)->where('type', 'accrual')->first();
            if ($pfLedger) {
                $pfLedger->update(['amount' => $pf, 'date' => $visit->visit_date]);
            } elseif ($pf != 0) {
                 PfLedger::create([
                    'executive_id' => $executive->id,
                    'visit_id'     => $visit->id,
                    'date'         => $visit->visit_date,
                    'type'         => 'accrual',
                    'description'  => 'Daily Report Accrual (Updated)',
                    'amount'       => $pf,
                ]);
            }

            $pensionLedger = PensionLedger::where('visit_id', $visit->id)->where('type', 'accrual')->first();
            if ($pensionLedger) {
                $pensionLedger->update(['amount' => $validated['pension'] ?? 0, 'date' => $visit->visit_date]);
            } elseif (($validated['pension'] ?? 0) != 0) {
                 PensionLedger::create([
                    'executive_id' => $executive->id,
                    'visit_id'     => $visit->id,
                    'date'         => $visit->visit_date,
                    'type'         => 'accrual',
                    'description'  => 'Daily Report Pension Deduction (Updated)',
                    'amount'       => $validated['pension'] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json($visit);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update visit'], 500);
        }
    }

    public function destroy(Executive $executive, Visit $visit)
    {
         DB::beginTransaction();
         try {
             $executive->decrement('pf_balance', $visit->pf);
             $executive->decrement('pension_balance', $visit->pension);
             $visit->delete(); // Cascades to ledgers if foreign key is set up with cascade, but let's be explicit or rely on it.
                             // Actually, in migrations `visit_id` is nullOnDelete. So we should delete manual or cascade.
             PfLedger::where('visit_id', $visit->id)->delete();
             PensionLedger::where('visit_id', $visit->id)->delete();
             
             DB::commit();
             return response()->json(['message' => 'Visit deleted']);
         } catch (\Exception $e) {
             DB::rollBack();
             return response()->json(['error' => 'Failed to delete'], 500);
         }
    }

    private function calculateAllowance($total)
    {
        if ($total < 15000) {
            return $total * 0.30;
        }
        return floor($total / 1500) * 540;
    }
}
