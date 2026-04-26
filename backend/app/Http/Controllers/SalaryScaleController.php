<?php

namespace App\Http\Controllers;

use App\Models\SalaryScale;
use Illuminate\Http\Request;

class SalaryScaleController extends Controller
{
    public function index()
    {
        return response()->json(SalaryScale::orderBy('amount')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'allowance' => 'required|numeric|min:0',
        ]);

        $scale = SalaryScale::create($validated);
        return response()->json($scale, 201);
    }

    public function update(Request $request, SalaryScale $scale)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'allowance' => 'required|numeric|min:0',
        ]);

        $scale->update($validated);
        return response()->json($scale);
    }

    public function destroy(SalaryScale $scale)
    {
        $scale->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
