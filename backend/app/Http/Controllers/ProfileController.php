<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name'     => 'required|string',
            'username' => 'required|string|unique:users,username,' . $user->id,
            'password' => 'nullable|string|min:4|confirmed',
        ]);

        DB::beginTransaction();
        try {
            $user->name = $validated['name'];
            $user->username = $validated['username'];
            
            if ($request->filled('password')) {
                $user->password = Hash::make($validated['password']);
            }
            
            $user->save();

            // If it's an executive, sync back to executive table
            if ($user->role === 'executive' && $user->executive_id) {
                $user->executive->update([
                    'name'  => $user->name,
                    'phone' => $user->username
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
