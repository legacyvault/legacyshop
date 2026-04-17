<?php

use App\Http\Controllers\API\V1\OrderController;
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

Route::group(['prefix' => 'v1'], function () {
    Route::post('notification', [OrderController::class, 'handleNotification']);
    Route::post('paypal/notification', [OrderController::class, 'handlePaypalExpire']);

    //Checkout API
    Route::post('checkout/order', [OrderController::class, 'checkout'])->name('order.checkout');

    Route::post('checkout-paypal/order', [OrderController::class, 'checkoutPaypal'])->name('order.checkout-paypal');
    Route::post('/orders/{orderId}/capture', [OrderController::class, 'capturePaypal'])->name('order.capture-paypal');

    //Checkout API
    Route::get('transaction-status/{transaction_id}', [OrderController::class, 'getTransactionStatus'])->name('transaction.status');
    Route::get('reopen-snap/{order_number}', [OrderController::class, 'reopenSnapPayment'])->name('snap.reopen');
    Route::get('reopen-paypal/{order_number}', [OrderController::class, 'reopenPaypalPayment'])->name('paypal.reopen');
});
