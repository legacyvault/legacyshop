<?php

namespace App\Http\Middleware;

use App\Http\Traits\Cognito;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        if (!$user || !$user->auth_token) {
            return redirect()->route('login')->with('error', 'Session is over, please re-login.');
        }

        // 7-day idle check via sessions table last_activity
        $session = DB::table('sessions')->where('user_id', $user->id)->orderByDesc('last_activity')->first();
        if ($session && (time() - $session->last_activity) > (7 * 24 * 60 * 60)) {
            $this->revokeTokenFromCognito($user->refresh_token);
            $user->auth_token    = null;
            $user->refresh_token = null;
            $user->save();
            Auth::logout();
            return redirect()->route('login')->with('error', 'Session expired due to inactivity. Please re-login.');
        }

        // Validate access token; refresh silently if expired
        if (!$this->validateToken($user->auth_token)) {
            if ($user->refresh_token) {
                $refreshed = $this->refreshToken($user->refresh_token, $user->email);
                if ($refreshed['status'] === 'SUCCESS') {
                    $user->auth_token = $refreshed['access_token'];
                    $user->save();
                } else {
                    $user->auth_token    = null;
                    $user->refresh_token = null;
                    $user->save();
                    Auth::logout();
                    return redirect()->route('login')->with('error', 'Session is over, please re-login.');
                }
            } else {
                $user->auth_token = null;
                $user->save();
                Auth::logout();
                return redirect()->route('login')->with('error', 'Session is over, please re-login.');
            }
        }

        return $next($request);
    }
}
