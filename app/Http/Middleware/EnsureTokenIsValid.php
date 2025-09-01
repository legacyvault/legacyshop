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
        if (!$user) {
            Auth::logout();
            return redirect()->route('login');
        }
        $token = $user->auth_token;
        $cognitoTokenInfo = $this->validateToken($token);

        if (!$cognitoTokenInfo) {
            $user->auth_token = null;
            $user->refresh_token = null;
            $user->save();
            Auth::logout();
            return redirect()->route('login');
        }

        return $next($request);
    }
}
