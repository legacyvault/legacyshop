<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('products', function() {
        return Inertia::render('products/index');
    })->name('products');
});

//add product
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('add-product', function() {
        return Inertia::render('products/add-product');
    })->name('add-product');
});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
