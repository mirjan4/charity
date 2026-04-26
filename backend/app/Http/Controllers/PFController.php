<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use App\Models\MonthlyRecord;
use App\Models\PfLedger;
use App\Models\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PFController extends Controller
{
    public function getBalance($execId)
    {
        $cacheKey = "pf_balance_{$execId}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($execId) {
            $executive = Executive::findOrFail($execId);

            // Single optimized query combining true math calculation
            $contributions = (float) \App\Models\MonthlyRecord::where('executive_id', $execId)
                ->selectRaw('COALESCE(SUM((actual_salary + incentive_amount - pension) - paid_salary), 0) as total')
                ->value('total');

            $withdrawals = (float) \App\Models\PfLedger::where('executive_id', $execId)
                ->where('type', 'withdrawal')
                ->sum('amount');

            $gratuity = \App\Models\MonthlyRecord::where('executive_id', $execId)->sum('pension');

            return [
                'total_savings' => $contributions,
                'balance' => $contributions - $withdrawals,
                'gratuity_balance' => (float)$gratuity
            ];
        });
    }

    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'executive_id' => 'required|exists:executives,id',
            'amount'       => 'required|numeric|min:0.01',
            'date'         => 'required|date',
            'note'         => 'nullable|string',
        ]);

        $executive = Executive::findOrFail($validated['executive_id']);

        // Check balance using true math
        $contributions = (float) \App\Models\MonthlyRecord::where('executive_id', $executive->id)
            ->selectRaw('COALESCE(SUM((actual_salary + incentive_amount - pension) - paid_salary), 0) as total')
            ->value('total');

        $withdrawals = (float) \App\Models\PfLedger::where('executive_id', $executive->id)
            ->where('type', 'withdrawal')
            ->sum('amount');
            
        $currentBalance = $contributions - $withdrawals;

        if ($validated['amount'] > $currentBalance) {
            return response()->json(['error' => 'Insufficient PF balance.'], 403);
        }

        // Insert into pf_ledgers
        $withdrawal = PfLedger::create([
            'executive_id' => $executive->id,
            'date'         => $validated['date'],
            'type'         => 'withdrawal',
            'amount'       => $validated['amount'],
            'note'         => $validated['note'],
        ]);

        // Bust all caches that include this executive's PF data
        \Illuminate\Support\Facades\Cache::forget("pf_balance_{$executive->id}");
        \Illuminate\Support\Facades\Cache::forget("exec_full_{$executive->id}");
        // Flush paginated executive list caches (pages 1-10 covers all normal cases)
        for ($p = 1; $p <= 10; $p++) {
            \Illuminate\Support\Facades\Cache::forget("execs_p{$p}_s" . md5(''));
        }

        return response()->json($withdrawal);
    }

    public function ledger($execId)
    {
        $executive = Executive::findOrFail($execId);

        // Compute total savings as the single source of truth
        $totalSavings = (float) MonthlyRecord::where('executive_id', $execId)
            ->selectRaw('COALESCE(SUM((actual_salary + incentive_amount - pension) - paid_salary), 0) as total')
            ->value('total');

        // Only real withdrawals from pf_ledgers (no contributions stored anymore)
        $withdrawals = PfLedger::where('executive_id', $execId)
            ->where('type', 'withdrawal')
            ->orderBy('date', 'asc')
            ->get();

        // Build running balance: starts at totalSavings, each withdrawal reduces it
        $runningBalance = $totalSavings;
        $rows = [];
        foreach ($withdrawals as $w) {
            $runningBalance -= (float) $w->amount;
            $rows[] = [
                'id'              => $w->id,
                'date'            => $w->date,
                'type'            => 'withdrawal',
                'amount'          => (float) $w->amount,
                'note'            => $w->note,
                'balance_after'   => $runningBalance,
            ];
        }

        // Reverse so latest withdrawal is first in the table
        return response()->json([
            'total_savings'    => $totalSavings,
            'available_balance'=> $runningBalance,
            'withdrawals'      => array_reverse($rows),
        ]);
    }
}
