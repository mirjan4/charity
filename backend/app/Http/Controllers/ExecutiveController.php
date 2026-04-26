<?php

namespace App\Http\Controllers;

use App\Models\Executive;
use Illuminate\Http\Request;

class ExecutiveController extends Controller
{
    public function index(Request $request)
    {
        $fetchAll = $request->get('all'); 
        
        if ($fetchAll) {
            return Executive::select('id', 'name', 'code')->orderBy('name', 'asc')->get();
        }

        $query = Executive::select('id', 'code', 'name', 'phone', 'place', 'join_date', 'fixed_salary', 'active');
        
        $search = $request->get('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('place', 'like', "%{$search}%");
            });
        }

        // Return simpler data first to ensure 500 error goes away
        return $query->orderBy('code', 'asc')->paginate(20);
    }



    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'         => 'required|unique:executives,code',
            'name'         => 'required|string',
            'phone'        => 'required|string|unique:users,username',
            'join_date'    => 'nullable|date',
            'fixed_salary' => 'numeric|min:0',
            'place'        => 'nullable|string',
            'active'       => 'boolean',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $executive = Executive::create($validated);
            
            \App\Models\User::create([
                'name'         => $executive->name,
                'username'     => $executive->phone,
                'password'     => \Illuminate\Support\Facades\Hash::make('1234'),
                'role'         => 'executive',
                'executive_id' => $executive->id
            ]);

            \Illuminate\Support\Facades\DB::commit();
            return response()->json($executive, 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $executive = Executive::findOrFail($id);
        
        // 1. PF Balance 
        $contributions = \App\Models\MonthlyRecord::where('executive_id', $id)
            ->selectRaw('COALESCE(SUM((actual_salary + incentive_amount - pension) - paid_salary), 0) as total')
            ->value('total');

        $withdrawals = \App\Models\PfLedger::where('executive_id', $id)
            ->where('type', 'withdrawal')
            ->sum('amount');
            
        $gratuity = \App\Models\MonthlyRecord::where('executive_id', $id)->sum('pension');

        // 2. Recent Records (Simple version)
        $recentRecords = \App\Models\MonthlyRecord::where('executive_id', $id)
            ->with(['bookUsages.receiptBook'])
            ->orderBy('record_date', 'desc')
            ->get();

        // 3. Books (Active only)
        $activeBooks = \App\Models\ReceiptBook::where('executive_id', $id)
            ->where('status', 'active')
            ->get();

        return [
            'executive' => $executive,
            'pf' => [
                'total_savings' => (float)$contributions,
                'balance' => (float)$contributions - (float)$withdrawals,
                'gratuity_balance' => (float)$gratuity
            ],
            'records' => $recentRecords,
            'books' => $activeBooks,
            'timestamp' => now()->toISOString()
        ];
    }


    public function update(Request $request, $id)
    {
        $executive = Executive::findOrFail($id);
        $validated = $request->validate([
            'code'         => 'required|unique:executives,code,' . $executive->id,
            'name'         => 'required|string',
            'phone'        => 'required|string',
            'join_date'    => 'nullable|date',
            'fixed_salary' => 'numeric|min:0',
            'place'        => 'nullable|string',
            'active'       => 'boolean',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $executive->update($validated);
            
            \App\Models\User::updateOrCreate(
                ['executive_id' => $executive->id],
                [
                    'name'     => $executive->name,
                    'username' => $executive->phone,
                    'role'     => 'executive'
                ]
            );

            \Illuminate\Support\Facades\DB::commit();
            return response()->json($executive);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $executive = Executive::findOrFail($id);
        $executive->delete();
        return response()->json(['message' => 'Executive deleted']);
    }

    public function resetPassword($id)
    {
        $executive = Executive::findOrFail($id);
        $user = \App\Models\User::where('executive_id', $executive->id)->first();

        if (!$user) {
            return response()->json(['error' => 'No associated user found for this executive.'], 404);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make('1234')
        ]);

        return response()->json(['message' => 'Password reset to default (1234) successfully.']);
    }
}
