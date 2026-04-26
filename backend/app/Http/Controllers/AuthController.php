<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required',
        ]);

        $login = $request->login;
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        if (!Auth::attempt([$field => $login, 'password' => $request->password])) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials.'],
            ]);
        }

        $user = Auth::user()->load('executive');

        if ($user->role === 'executive') {
            $executive = $user->executive;
            if (!$executive || !$executive->active) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'login' => ['Your account has been deactivated. Please contact the administrator.'],
                ]);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $cacheKey = "user_profile_{$user->id}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
            // Prevent already-logged-in executives who were deactivated from keeping their session active
            if ($user->role === 'executive') {
                $executive = $user->executive;
                if (!$executive || !$executive->active) {
                    $user->currentAccessToken()->delete();
                    abort(403, 'Account is inactive');
                }
            }

            return $user->load('executive');
        });
    }
}
