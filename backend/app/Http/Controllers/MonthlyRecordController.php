<?php

namespace App\Http\Controllers;

use App\Models\MonthlyRecord;
use App\Models\PfLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonthlyRecordController extends Controller
{
    public function index(Request $request, $executiveId)
    {
        $page = $request->get('page', 1);
        $cacheKey = "exec_{$executiveId}_records_p{$page}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($executiveId) {
            return MonthlyRecord::select('*')
                ->where('executive_id', $executiveId)
                ->withAccumulated()
                ->with(['bookUsages.receiptBook'])
                ->orderBy('record_date', 'desc')
                ->paginate(15);
        });
    }

    public function destroy($id)
    {
        $record = MonthlyRecord::findOrFail($id);
        
        DB::beginTransaction();
        try {
            // Delete associated PF contributions for this specific date's month
            // We use the reference_month (YYYY-MM) which was stored during compute
            $refMonth = substr($record->record_date, 0, 7);
            PfLedger::where('executive_id', $record->executive_id)
                    ->where('reference_month', $refMonth)
                    ->where('type', 'contribution')
                    ->delete();
            
            $record->delete();
            
            DB::commit();
            return response()->json(['message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
