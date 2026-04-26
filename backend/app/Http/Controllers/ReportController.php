<?php

namespace App\Http\Controllers;

use App\Models\MonthlyRecord;
use App\Models\Executive;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function financial(Request $request)
    {
        $start = $request->query('start_date');
        $end = $request->query('end_date');
        $execId = $request->query('executive_id');

        $query = MonthlyRecord::query();
        
        if ($start)  $query->where('record_date', '>=', $start);
        if ($end)    $query->where('record_date', '<=', $end);
        if ($execId) $query->where('executive_id', $execId);

        // 2. Efficiently fetch summary using DB aggregates
        $summaryQuery = clone $query;
        $summaryStats = $summaryQuery->selectRaw('
            SUM(charity_collection + orphanage_collection + kidma_collection) as total_collection,
            SUM(actual_salary) as total_actual_salary,
            SUM(pension) as total_gratuity,
            SUM(paid_to_office) as total_paid_to_office,
            SUM(charity_collection) as charity_total,
            SUM(orphanage_collection) as orphanage_total,
            SUM(kidma_collection) as kidma_total,
            SUM(charity_expense) as charity_exp,
            SUM(orphanage_expense) as orphanage_exp,
            SUM(kidma_expense) as kidma_exp
        ')->first();

        // 1. Fetch records with eager loading for the list
        $records = $query->with('executive:id,name,code,place')
                         ->orderBy('record_date', 'desc')
                         ->get();

        $summary = [
            'totalCollection' => $summaryStats->total_collection ?? 0,
            'totalActualSalary' => $summaryStats->total_actual_salary ?? 0,
            'totalGratuity' => $summaryStats->total_gratuity ?? 0,
            'totalPaidToOffice' => $summaryStats->total_paid_to_office ?? 0,
            'byCategory' => [
                'charity' => $summaryStats->charity_total ?? 0,
                'orphanage' => $summaryStats->orphanage_total ?? 0,
                'khidma' => $summaryStats->kidma_total ?? 0,
            ],
            'byCategoryExpense' => [
                'charity' => $summaryStats->charity_exp ?? 0,
                'orphanage' => $summaryStats->orphanage_exp ?? 0,
                'khidma' => $summaryStats->kidma_exp ?? 0,
            ]
        ];

        return response()->json([
            'summary' => $summary,
            'records' => $records
        ]);
    }

    public function getMonthlyRecords($month)
    {
        // Use indexed month column instead of LIKE
        $records = MonthlyRecord::where('month', $month)
                    ->with('executive:id,name,code,place')
                    ->orderBy('record_date', 'desc')
                    ->get();
        return response()->json($records);
    }
}
