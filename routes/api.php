<?php

use App\Http\Controllers\API\V1\AwsCognitoAuthController;
use App\Http\Controllers\API\V1\InventoryController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\ProfileController;
use App\Http\Controllers\API\V1\ProjectController;
use App\Http\Controllers\API\V1\QuotationController;
use App\Http\Controllers\API\V1\RoleController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\UsersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {
    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile']);
    Route::get('profile', [UserController::class, 'getProfile']);

    //Category API
    Route::post('create-category', [ProductController::class, 'createCategory']);
    Route::post('update-category', [ProductController::class, 'updateCategory']);
    Route::get('category', [ProductController::class, 'getAllCategory']);

    //Type API
    Route::post('create-type', [ProductController::class, 'createType']);
    Route::post('update-type', [ProductController::class, 'updateType']);
    Route::get('type', [ProductController::class, 'getAllType']);

    Route::post('logout', [AwsCognitoAuthController::class, 'logout']);
});

Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('register', [AwsCognitoAuthController::class, 'registerUser']);
});

Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('login', [AwsCognitoAuthController::class, 'login']);
});
