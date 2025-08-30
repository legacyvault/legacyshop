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
                'role_id' => 'admin',
                'password' => 'lMjKoP123!?',
                'confirm_password' => 'lMjKoP123!?',
            ],
            [
                'name' => 'User Test',
                'email' => 'ramadianardtm@gmail.com',
                'role_id' => 'user',
                'password' => 'lMjKoP123!?',
                'confirm_password' => 'lMjKoP123!?',
            ],
        ];

        foreach ($data_users as $user_data) {
            $data = [
                'email' => $user_data['email'],
                'password' => bcrypt($user_data['password'])
            ];

            $createUser = User::create($data);
            // $this->customCreateUser($user_data);

            if ($createUser) {
                $data_profile = [
                    'user_id' => $createUser->id,
                    'name' => $user_data['name'],
                ];
                $createProfile = Profile::create($data_profile);
            }
        }
    }
}
