<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = Auth::user();
        Log::info('Role Middleware Start..');
        Log::info($user);
        if (!$user) {
            Auth::logout();
            return redirect()->route('login')->with('error', 'You are not allowed.');
        }

        if ($user->role !== $role) {
            $user->auth_token = null;
            $user->refresh_token = null;
            $user->save();
            Auth::logout();
            return redirect()->route('login')->with('error', 'You are not allowed.');
        }

        return $next($request);
    }
}
