<?php

namespace App\Http\Middleware;

use App\Http\Traits\Cognito;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    use Cognito;
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        Log::info('EnsureToken Start..');
        Log::info($user);
        if (!$user) {
            return redirect()->route('login')->with('error', 'Session is over, please re-login.');
        }
        $token = $user->auth_token;
        if (!$token) {
            return redirect()->route('login')->with('error', 'Session is over, please re-login.');
        }
        $cognitoTokenInfo = $this->validateToken($token);

        if (!$cognitoTokenInfo) {
            $user->auth_token = null;
            $user->refresh_token = null;
            $user->save();
            Auth::logout();
            return redirect()->route('login')->with('error', 'Session is over, please re-login.');
        }

        return $next($request);
    }
}
