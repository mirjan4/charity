<?php

namespace App\Http\Controllers;

use App\Models\Rule;
use Illuminate\Http\Request;

class RuleController extends Controller
{
    public function index()
    {
        $rule = Rule::first();
        if (!$rule) {
            $rule = Rule::create([
                'pension_mode' => 'rate',
                'pension_rate' => 3.0,
                'pf_lock_months' => 6,
            ]);
        }
        return response()->json($rule);
    }

    public function update(Request $request)
    {
        $rule = Rule::first();
        if (!$rule) {
            $rule = new Rule();
        }

        $validated = $request->validate([
            'pension_mode'   => 'required|in:manual,rate',
            'pension_rate'   => 'required|numeric|min:0',
            'pf_lock_months' => 'required|integer|min:0',
        ]);

        $rule->fill($validated);
        $rule->save();

        return response()->json($rule);
    }
}
