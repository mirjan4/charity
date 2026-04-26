<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use App\Models\MonthlyRecord;
use App\Models\PfLedger;
use App\Models\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $currentMonth = $now->format('Y-m');
        $prevMonth = $now->copy()->subMonth()->format('Y-m');

        // Cache dashboard stats for 5 minutes since they don't change frequently
        return response()->json(
            \Illuminate\Support\Facades\Cache::remember('dashboard_stats', 300, function () use ($currentMonth, $prevMonth) {
                $activeExecsCount = Executive::where('active', true)->count();
                $totalExecsCount = Executive::count();

                // Single optimized query for all dashboard stats
                $stats = DB::selectOne("
                    SELECT
                        SUM(CASE WHEN month = ? THEN charity_collection + orphanage_collection + kidma_collection ELSE 0 END) as current_collection,
                        SUM(CASE WHEN month = ? THEN charity_expense + orphanage_expense + kidma_expense ELSE 0 END) as current_expense,
                        COUNT(DISTINCT CASE WHEN month = ? THEN executive_id END) as attendance_count,
                        SUM(CASE WHEN month = ? THEN charity_collection ELSE 0 END) as charity_total,
                        SUM(CASE WHEN month = ? THEN orphanage_collection ELSE 0 END) as orphanage_total,
                        SUM(CASE WHEN month = ? THEN kidma_collection ELSE 0 END) as kidma_total,
                        SUM(CASE WHEN month = ? THEN charity_collection + orphanage_collection + kidma_collection ELSE 0 END) as prev_collection
                    FROM monthly_records
                    WHERE month IN (?, ?)
                ", [
                    $currentMonth, $currentMonth, $currentMonth, $currentMonth,
                    $currentMonth, $currentMonth, $prevMonth, $currentMonth, $prevMonth
                ]);

                $currentCollection = $stats->current_collection ?? 0;
                $currentExpense = $stats->current_expense ?? 0;
                $attendanceCount = $stats->attendance_count ?? 0;
                $prevCollection = $stats->prev_collection ?? 0;

                $monthBreakdown = [
                    'charity' => $stats->charity_total ?? 0,
                    'orphanage' => $stats->orphanage_total ?? 0,
                    'khidma' => $stats->kidma_total ?? 0,
                ];

                return [
                    'totalExecutives' => $totalExecsCount,
                    'activeExecutives' => $activeExecsCount,
                    'monthCollection' => $currentCollection,
                    'prevMonthCollection' => $prevCollection,
                    'monthExpense' => $currentExpense,
                    'monthAttendance' => $attendanceCount,
                    'collectionDifference' => $currentCollection - $prevCollection,
                    'monthBreakdown' => $monthBreakdown,
                    'todayBreakdown' => [
                        'charity' => 0, 'orphanage' => 0, 'khidma' => 0,
                        'total' => 0, 'charityExp' => 0, 'orphanageExp' => 0, 'khidmaExp' => 0, 'totalExp' => 0
                    ],
                ];
            })
        );
    }
}
