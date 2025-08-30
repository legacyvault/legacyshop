<?php

namespace App\Http\Middleware;

use App\Http\Traits\Cognito;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
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
        $token = $request->header('Authorization');

        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);

            $user = User::where('auth_token', $token)->first();

            if (!$user) {
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Unauthorized: Invalid token. Please re-login.',
                        'status_code' => Response::HTTP_UNAUTHORIZED
                    ]
                ];
                return response()->json($response, Response::HTTP_UNAUTHORIZED);
            }

            $cognitoTokenInfo = $this->validateToken($token);

            if (!$cognitoTokenInfo) {
                $user->auth_token = null;
                $user->refresh_token = null;
                $user->save();
                $response = [
                    'data' => '',
                    'meta' => [
                        'message' => 'Unauthorized: Invalid token.',
                        'status_code' => Response::HTTP_UNAUTHORIZED
                    ]
                ];
                return response()->json($response, Response::HTTP_UNAUTHORIZED);
            }

            return $next($request);
        } else {
            return response(['message' => 'Invalid Authentication Token'], Response::HTTP_UNAUTHORIZED);
        }
    }
}
