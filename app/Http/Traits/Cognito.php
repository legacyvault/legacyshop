<?php

namespace App\Http\Traits;

use Aws\CognitoIdentityProvider\CognitoIdentityProviderClient;
use Aws\CognitoIdentityProvider\Exception\CognitoIdentityProviderException;
use Aws\Exception\AwsException;
use Illuminate\Support\Facades\Log;

trait Cognito
{
    public $INVALID_PASSWORD = 'InvalidPasswordException';
    public $CODE_MISMATCH    = 'CodeMismatchException';
    public $EXPIRED_CODE     = 'ExpiredCodeException';
    public $USER_NOT_FOUND   = 'UserNotFoundException';
    public $USERNAME_EXISTS  = 'UsernameExistsException';

    protected function getAWSCognitoClient(): CognitoIdentityProviderClient
    {
        $aws_cognito_config = [
            'region' => env('AWS_DEFAULT_REGION'),
            'version' => 'latest',
            'credentials' => [
                'key' => env('AWS_ACCESS_KEY_ID'),
                'secret' => env('AWS_SECRET_ACCESS_KEY'),
            ],
            'http' => ['verify' => false]
        ];

        return new CognitoIdentityProviderClient($aws_cognito_config);
    }

    public function customCreateUser($data)
    {
        $client = $this->getAWSCognitoClient();
        $userPoolId = env('AWS_COGNITO_USER_POOL_ID');

        try {
            $result = $client->adminCreateUser([
                'UserPoolId' => $userPoolId,
                'Username' => $data['email'],
                'TemporaryPassword' => null,
                'UserAttributes' => [
                    [
                        'Name' => 'email',
                        'Value' => $data['email']
                    ],
                    [
                        'Name' => 'email_verified',
                        'Value' => 'true'
                    ],
                ],
                'DesiredDeliveryMediums' => ['EMAIL'],
            ]);

            if (isset($result['User'])) {
                return 'SUCCESS';
            } else {
                return 'FAILURE';
            }
        } catch (CognitoIdentityProviderException $e) {
            if ($e->getAwsErrorCode() === $this->USERNAME_EXISTS) {
                Log::debug('Username already exists in Cognito: ' . $data['email']);
            } else {
                Log::error($e->getAwsErrorMessage());
            }

            return $e->getAwsErrorMessage();
        }
    }

    public function initiateAuth($username, $password)
    {
        $client = $this->getAWSCognitoClient();
        $secretHash = base64_encode(hash_hmac('sha256', $username . env('AWS_COGNITO_CLIENT_ID'), env('AWS_COGNITO_CLIENT_SECRET'), true));

        try {
            $result = $client->initiateAuth([
                'ClientId' => env('AWS_COGNITO_CLIENT_ID'),
                'AuthFlow' => 'USER_PASSWORD_AUTH',
                'AuthParameters' => [
                    'USERNAME' => $username,
                    'PASSWORD' => $password,
                    'SECRET_HASH' => $secretHash,
                ],
            ]);

            if (isset($result['ChallengeName']) && $result['ChallengeName'] === 'NEW_PASSWORD_REQUIRED') {
                Log::info('New Password Required');
                return ([
                    'status' => 'NEW_PASSWORD_REQUIRED',
                    'session_token' => $result['Session']
                ]);
            } else {
                $authResult = $result['AuthenticationResult'];
                $accessToken = $authResult['AccessToken'];
                $refreshToken = $authResult['RefreshToken'];

                return ([
                    'status' => 'success',
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken
                ]);
            }
        } catch (\Aws\Exception\AwsException $e) {
            // Catch AWS-specific exceptions
            Log::error('AWS Exception: ' . $e->getAwsErrorMessage());
            return [
                'status' => 'failed',
                'message' => 'Failed to initiate auth.'
            ];
        }
    }

    public function adminDeleteUser($data)
    {
        $client = $this->getAWSCognitoClient();
        $userPoolId = env('AWS_COGNITO_USER_POOL_ID');

        try {
            $result = $client->adminDeleteUser([
                'UserPoolId' => $userPoolId,
                'Username' => $data['email'],
            ]);

            return true;
            
        } catch (CognitoIdentityProviderException $e) {

            Log::error($e->getAwsErrorMessage());

            return false;
        }
    }

    public function respondToNewPasswordChallenge($username, $newPassword, $session)
    {
        $client = $this->getAWSCognitoClient();
        $secretHash = base64_encode(hash_hmac('sha256', $username . env('AWS_COGNITO_CLIENT_ID'), env('AWS_COGNITO_CLIENT_SECRET'), true));

        try {
            $result = $client->respondToAuthChallenge([
                'ClientId' => env('AWS_COGNITO_CLIENT_ID'),
                'ChallengeName' => 'NEW_PASSWORD_REQUIRED',
                'ChallengeResponses' => [
                    'USERNAME' => $username,
                    'NEW_PASSWORD' => $newPassword,
                    'SECRET_HASH' => $secretHash,
                ],
                'Session' => $session,
            ]);

            if (isset($result['AuthenticationResult'])) {
                $authResult = $result['AuthenticationResult'];
                $accessToken = $authResult['AccessToken'];
                $refreshToken = $authResult['RefreshToken'];

                return ([
                    'status' => 'success',
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken
                ]);
            } else {
                Log::error('Authentication failed: AuthenticationResult not found.');
                return [
                    'status' => 'failed',
                    'message' => 'AuthenticationResult not found in response.'
                ];
            }
        } catch (AwsException $e) {
            Log::error($e->getMessage());
            return ['status' => 'failed'];
        }
    }

    public function revokeTokenFromCognito($refresh_token)
    {
        $client = $this->getAWSCognitoClient();

        try {
            $result = $client->revokeToken([
                'ClientId' => env('AWS_COGNITO_CLIENT_ID'),
                'ClientSecret' => env('AWS_COGNITO_CLIENT_SECRET'),
                'Token' => $refresh_token,
            ]);

            return true;
        } catch (AwsException $e) {
            Log::error($e->getMessage());
            return false;
        }
    }

    public function validateToken($token)
    {
        $client = $this->getAWSCognitoClient();

        try {
            $result = $client->getUser([
                'AccessToken' => $token,
            ]);

            return true;
        } catch (AwsException $e) {
            Log::error($e->getMessage());
            return false;
        }
    }
}
