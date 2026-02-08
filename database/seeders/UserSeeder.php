<?php

namespace Database\Seeders;

use App\Http\Traits\Cognito;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use Cognito;
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data_users = [
            [
                'name' => 'Admin Test',
                'email' => 'ramadianarditama66@gmail.com',
                'role' => 'admin',
                'password' => 'lMjKoP123!?',
                'confirm_password' => 'lMjKoP123!?',
            ],
            [
                'name' => 'LegacyVault Admin',
                'email' => 'legacyvault14@gmail.com',
                'role' => 'admin',
                'password' => 'lMjKoP123!?',
                'confirm_password' => 'lMjKoP123!?',
            ],
            [
                'name' => 'User Test',
                'email' => 'ramadianardtm@gmail.com',
                'role' => 'user',
                'password' => 'lMjKoP123!?',
                'confirm_password' => 'lMjKoP123!?',
            ],
            [
                'name' => 'gifino',
                'email' => 'gifino@email.com',
                'role' => 'user',
                'password' => 'Gifino_123',
                'confirm_password' => 'Gifino_123',
            ],
            [
                'name' => 'gifino admin',
                'email' => 'gifino-admin@email.com',
                'role' => 'admin',
                'password' => 'Gifino_123',
                'confirm_password' => 'Gifino_123',
            ],
        ];

        foreach ($data_users as $user_data) {
            $data = [
                'email' => $user_data['email'],
                'password' => bcrypt($user_data['password']),
                'role' => $user_data['role']
            ];

            $createUser = User::create($data);
            // $this->customCreateUser($user_data);

            if ($createUser) {
                $data_profile = [
                    'user_id' => $createUser->id,
                    'name' => $user_data['name'],
                    'country' => 'ID'
                ];
                $createProfile = Profile::create($data_profile);
            }
        }
    }
}
