<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use App\Models\MonthlyRecord;
use App\Models\PfLedger;
use App\Models\BookUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    public function compute(Request $request)
    {
        $validated = $request->validate([
            'executive_id'   => 'required|exists:executives,id',
            'record_date'    => 'required|date',
            'book_entries'   => 'required|array',
            'book_entries.*.book_id'  => 'required|exists:receipt_books,id',
            'book_entries.*.start_page' => 'required|integer',
            'book_entries.*.end_page'   => 'required|integer|gte:book_entries.*.start_page',
            'book_entries.*.amount'     => 'required|numeric|min:0',
            'book_entries.*.category'   => 'required|in:charity,orphanage,khidma',
            'expenses'       => 'nullable|array',
            'gratuity_mode'   => 'required|in:manual,rate',
            'gratuity_manual' => 'nullable|numeric|min:0',
            'gratuity_rate'   => 'nullable|numeric|min:0',
            'fixed_salary'   => 'nullable|numeric|min:0',
            'allowance_mode' => 'required|in:default,percentage,manual',
            'allowance_rate' => 'nullable|numeric|min:0',
            'allowance_manual' => 'nullable|numeric|min:0',
            'box_percentage'   => 'nullable|numeric|min:0',
            'allowance_toggles' => 'nullable|array',
            'salary_mode'      => 'nullable|string|in:auto,manual',
            'notes'            => 'nullable|string',
            'box_count'        => 'nullable|numeric|min:0',
            'paid_to_office'   => 'nullable|numeric',
        ]);

        $executive = Executive::findOrFail($validated['executive_id']);

        // Calculate Collections and Page Counts from Book Entries
        $charity_col = 0;
        $orphan_col = 0;
        $kidma_col = 0;
        $total_charity_leaves = 0;

        foreach ($validated['book_entries'] as $entry) {
            if ($entry['category'] === 'charity') {
                $charity_col += (float)$entry['amount'];
                $total_charity_leaves += ($entry['end_page'] - $entry['start_page'] + 1);
            } elseif ($entry['category'] === 'orphanage') {
                $orphan_col += (float)$entry['amount'];
            } elseif ($entry['category'] === 'khidma') {
                $kidma_col += (float)$entry['amount'];
            }
        }

        $total_collection = $charity_col + $orphan_col + $kidma_col;

        // Slab Incentive Calculation
        // Prefer manual override if provided in request
        $incentive_rate = (float)($validated['box_percentage'] ?? 0);
        
        if ($incentive_rate <= 0) {
            if ($total_charity_leaves >= 1000) {
                $incentive_rate = 5.0;
                if ($total_charity_leaves > 1100) {
                    $extra_slabs = ceil(($total_charity_leaves - 1100) / 100);
                    $incentive_rate += ($extra_slabs * 0.2);
                }
            }
        }

        $incentive_amount = $charity_col * ($incentive_rate / 100);

        // NEW LOGIC: Calculate Allowance Base from toggled categories only
        $allowance_toggles = $validated['allowance_toggles'] ?? [
            'charity' => true,
            'orphanage' => true,
            'khidma' => true
        ];

        $active_collection = 0;
        foreach ($validated['book_entries'] as $entry) {
            $cat = $entry['category'];
            if ($allowance_toggles[$cat] ?? true) {
                $active_collection += (float)$entry['amount'];
            }
        }

        $actual_salary = 0;
        if ($validated['allowance_mode'] === 'percentage') {
            $actual_salary = $active_collection * ($validated['allowance_rate'] / 100);
        } elseif ($validated['allowance_mode'] === 'manual') {
            $actual_salary = (float)($validated['allowance_manual'] ?? 0);
        } else {
            // Default mode: Prefer provided manual override if set, else auto-calc based on active collection
            if (isset($validated['allowance_manual']) && (float)$validated['allowance_manual'] > 0) {
                $actual_salary = (float)$validated['allowance_manual'];
            } else {
                if ($active_collection < 15000) {
                    $actual_salary = $active_collection * 0.33;
                } else {
                    $actual_salary = (floor($active_collection / 1500) * 540);
                }
            }
        }

        // Add box incentive to the total allowance pool
        $total_allowance = $actual_salary + $incentive_amount;

        $fixed_salary = isset($validated['fixed_salary']) 
            ? (float)$validated['fixed_salary'] 
            : (float)$executive->fixed_salary;

        // Gratuity calculation
        if ($validated['gratuity_mode'] === 'rate') {
            $gratuity = $total_allowance * ($validated['gratuity_rate'] / 100);
        } else {
            if (!isset($validated['gratuity_manual']) || $validated['gratuity_manual'] === '') {
                if ($total_collection < 15000) {
                    $gratuity = $total_allowance * 0.33;
                } else {
                    $diff = $total_allowance * (40 / 540);
                    $gratuity = (2 / 3) * $diff;
                }
            } else {
                $gratuity = (float)$validated['gratuity_manual'];
            }
        }

        // Paid Amount (What executive gives back) = Total Collection - (Fixed Salary + Incentive)
        $paid_to_office = $total_collection - ($fixed_salary + $incentive_amount);
        
        // PF / Savings = Total Allowance - Fixed Salary - Incentive - Gratuity
        $pf = $total_allowance - $fixed_salary - $incentive_amount - $gratuity;

        // Proportional Distribution Logic (Backend Sync)
        $charity_exp = 0; $orphan_exp = 0; $kidma_exp = 0;
        
        if ($active_collection > 0 && $actual_salary > 0) {
            $distributed = 0;
            $active_cats = [];
            foreach (['charity', 'orphanage', 'khidma'] as $c) {
                $col = ($c === 'charity' ? $charity_col : ($c === 'orphanage' ? $orphan_col : $kidma_col));
                if (($allowance_toggles[$c] ?? true) && $col > 0) {
                    $active_cats[] = $c;
                }
            }

            foreach ($active_cats as $index => $c) {
                $col = ($c === 'charity' ? $charity_col : ($c === 'orphanage' ? $orphan_col : $kidma_col));
                if ($index === count($active_cats) - 1) {
                    $share = round($actual_salary) - $distributed;
                } else {
                    $share = round(($col / $active_collection) * $actual_salary);
                }
                
                if ($c === 'charity')   $charity_exp = $share;
                elseif ($c === 'orphanage') $orphan_exp = $share;
                elseif ($c === 'khidma')   $kidma_exp = $share;
                
                $distributed += $share;
            }
        }

        DB::beginTransaction();
        try {
            $record = MonthlyRecord::create([
                'executive_id'         => $executive->id,
                'record_date'          => $validated['record_date'],
                'month'                => date('Y-m', strtotime($validated['record_date'])),
                'charity_collection'   => $charity_col,
                'orphanage_collection' => $orphan_col,
                'kidma_collection'     => $kidma_col,
                'charity_expense'      => $charity_exp,
                'orphanage_expense'    => $orphan_exp,
                'kidma_expense'        => $kidma_exp,
                    'pension_mode'         => $validated['gratuity_mode'],
                    'pension_manual'       => (float)($validated['gratuity_manual'] ?? 0),
                    'pension_rate'         => (float)($validated['gratuity_rate'] ?? 0),
                    'allowance_mode'       => $validated['allowance_mode'],
                    'allowance_rate'       => $validated['allowance_rate'],
                    'allowance_manual'     => $validated['allowance_manual'],
                    'incentive_leaves'     => $total_charity_leaves,
                    'incentive_rate'       => $incentive_rate,
                    'incentive_amount'     => $incentive_amount,
                    'box_count'            => $total_charity_leaves,
                    'box_percentage'       => $incentive_rate,
                    'actual_salary'        => $actual_salary,
                    'pension'              => $gratuity,
                    'pf'                   => $pf,
                    'paid_salary'          => ($fixed_salary + $incentive_amount),
                    'savings'              => (($actual_salary + $incentive_amount) - $gratuity) - ($fixed_salary + $incentive_amount),
                    'paid_to_office'       => $paid_to_office,
                    'salary_mode'          => $validated['salary_mode'] ?? 'auto',
                    'notes'                => $validated['notes'] ?? null,
                ]
            );

            // Sync Book Usages
            $record->bookUsages()->delete();
            foreach ($validated['book_entries'] as $entry) {
                BookUsage::create([
                    'monthly_record_id' => $record->id,
                    'receipt_book_id'   => $entry['book_id'],
                    'category'          => $entry['category'],
                    'start_page'        => $entry['start_page'],
                    'end_page'          => $entry['end_page'],
                    'amount'            => $entry['amount'],
                ]);

                // Auto-mark book as 'used' if max page is reached
                $book = \App\Models\ReceiptBook::find((int)$entry['book_id']);
                if ($book) {
                    // Extract trailing numeric part from book_number (e.g. "J2871" → 2871)
                    preg_match('/(\d+)$/', $book->book_number, $matches);
                    $numericNo = isset($matches[1]) ? (int)$matches[1] : 0;
                    $leaves    = (int)$book->leaves;
                    $maxPage   = $numericNo * $leaves;
                    $endPage   = (int)$entry['end_page'];

                    \Illuminate\Support\Facades\Log::info("BookAutoStatus", [
                        'book_number' => $book->book_number,
                        'numericNo'   => $numericNo,
                        'leaves'      => $leaves,
                        'maxPage'     => $maxPage,
                        'endPage'     => $endPage,
                        'willMark'    => ($maxPage > 0 && $endPage >= $maxPage) ? 'used' : 'active',
                    ]);

                    if ($maxPage > 0 && $endPage >= $maxPage) {
                        $book->update(['status' => 'used']);
                    } else {
                        $book->update(['status' => 'active']);
                    }
                }
            }

            // PF contributions are dynamically computed from monthly_records.
            // Only withdrawals are stored in pf_ledgers. No duplicate storage needed.

            DB::commit();
            return response()->json($record);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error("SalaryComputeError: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $validated
            ]);
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}

