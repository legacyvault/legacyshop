<?php

use App\Http\Controllers\API\V1\AWSCognitoAuthController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register');
})->name('register');


Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('products', function () {
        return Inertia::render('products/index');
    })->name('products');

    Route::get('add-product', function () {
        return Inertia::render('products/add-product');
    })->name('add-product');

    Route::get('add-product/{id?}', function ($id = null) {
        $product = $id ? 'edit' : null; //temporary solution

        //enable when there's get product api
        // if ($id) {
        //     $product = Product::findOrFail($id); // preload product if editing
        // }

        return Inertia::render('products/add-product', [
            'product' => $product,
        ]);
    })->name('add-product');
});

#API 
Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('login', [AWSCognitoAuthController::class, 'login'])->name('cognito.login');
});
Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('register', [AwsCognitoAuthController::class, 'registerUser'])->name('cognito.register');
});

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {
    //Product API
    Route::post('add-product', [ProductController::class, 'addProduct'])->name('addProduct');
    Route::post('product', [ProductController::class, 'getAllProduct'])->name('product');

    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile'])->name('profile.edit');
    Route::get('profile', [UserController::class, 'getProfile'])->name('profile.edit-view');

    //Category API
    Route::post('create-category', [ProductController::class, 'createCategory'])->name('category.create');
    Route::post('update-category', [ProductController::class, 'updateCategory'])->name('category.update');
    Route::get('category', [ProductController::class, 'getAllCategory'])->name('category');

    //Type API
    Route::post('create-type', [ProductController::class, 'createType'])->name('type.create');
    Route::post('update-type', [ProductController::class, 'updateType'])->name('category.update');
    Route::get('type', [ProductController::class, 'getAllType'])->name('type');

    Route::post('logout', [AwsCognitoAuthController::class, 'logout'])->name('cognito.logout');
});
