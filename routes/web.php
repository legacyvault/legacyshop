<?php

use App\Http\Controllers\API\V1\AWSCognitoAuthController;
use App\Http\Controllers\API\V1\LocationController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\ViewController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;

Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('products')->group(function() {
    
        Route::get('division', function () {
            return Inertia::render('products/division/index');
        })->name('division');
    
        Route::get('product', function () {
            return Inertia::render('products/product/index');
        })->name('product');
    
        Route::get('subcategory', function () {
            return Inertia::render('products/subcategory/index');
        })->name('subcategory');

        Route::get('variant', function () {
            return Inertia::render('products/variant/index');
        })->name('variant');

        Route::prefix('product')->group(function() {
            Route::get('add-product/{id?}', function ($id = null) {
                $product = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/product/add-product', [
                    'product' => $product,
                ]);
            })->name('add-product');

            Route::get('viewprod/{id?}', function ($id = null) {
                $product = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/product/view-product', [
                    'product' => $product,
                ]);
            })->name('view-product');
        });

        Route::prefix('subcategory')->group(function() {

            Route::get('viewsub/{id?}', function ($id = null) {
                $subcat = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/subcategory/view-subcategory', [
                    'subcat' => $subcat,
                ]);
            })->name('view-subcategory');

            Route::get('addsub/{id?}', function ($id = null) {
                $subcat = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/subcategory/add-subcategory', [
                    'subcat' => $subcat,
                ]);
            })->name('add-subcategory');
        });

        Route::prefix('division')->group(function() {

            Route::get('viewdiv/{id?}', function ($id = null) {
                $division = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/division/view-division', [
                    'division' => $division,
                ]);
            })->name('view-division');

            Route::get('adddiv/{id?}', function ($id = null) {
                $division = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/division/add-division', [
                    'division' => $division,
                ]);
            })->name('add-division');
        });

        Route::prefix('variant')->group(function() {

            Route::get('viewvar/{id?}', function ($id = null) {
                $variant = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/variant/view-variant', [
                    'variant' => $variant,
                ]);
            })->name('view-variant');

            Route::get('addvar/{id?}', function ($id = null) {
                $variant = $id ? 'edit' : null; //temporary solution
        
                //enable when there's get product api
                // if ($id) {
                //     $product = Product::findOrFail($id); // preload product if editing
                // }
        
                return Inertia::render('products/variant/add-variant', [
                    'variant' => $variant,
                ]);
            })->name('add-variant');
        });

    });

});

#API 
Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('login', [AWSCognitoAuthController::class, 'login'])->name('cognito.login');
});
Route::group(['prefix' => 'v1/cognito'], function () {
    Route::post('register', [AwsCognitoAuthController::class, 'registerUser'])->name('cognito.register');
});

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {
    //Location API
    Route::get('province-list', [LocationController::class, 'getProvinceList'])->name('province.list');
    Route::get('city-list/{geonameId}', [LocationController::class, 'getCitiesList'])->name('cities.list');
    Route::get('postal-code-list/{cityName}', [LocationController::class, 'getPostalCodeList'])->name('postal_code.list');

    //Product API
    Route::post('add-product', [ProductController::class, 'addProduct'])->name('addProduct');
    Route::post('product', [ProductController::class, 'getAllProduct'])->name('product');

    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile'])->name('profile.edit');
    Route::get('profile', [UserController::class, 'getProfile'])->name('profile.edit-view');
    Route::post('create-delivery-address', [UserController::class, 'createDeliveryAddress'])->name('create.delivery-address');

    //Category API
    Route::post('create-category', [ProductController::class, 'createCategory'])->name('category.create');
    Route::post('update-category', [ProductController::class, 'updateCategory'])->name('category.update');
    Route::get('category', [ProductController::class, 'getAllCategory'])->name('category');

    //Type API
    Route::post('create-type', [ProductController::class, 'createType'])->name('type.create');
    Route::post('update-type', [ProductController::class, 'updateType'])->name('type.update');
    Route::get('type', [ProductController::class, 'getAllType'])->name('type');

    //Tags API
    Route::post('create-tag', [ProductController::class, 'createTag'])->name('tag.create');
    Route::post('update-tag', [ProductController::class, 'updateTag'])->name('tag.update');
    Route::get('tag', [ProductController::class, 'getAllTags'])->name('tag');

    Route::post('logout', [AwsCognitoAuthController::class, 'logout'])->name('cognito.logout');
});

//CHANGE LANGUAGE
Route::get('/lang/{lang}', function ($lang) {

    if (in_array($lang, ['en', 'id'])) {
        session(['locale' => $lang]);
    }
    return back();
})->name('locale.switch');




//ROUTES
Route::get('/', function () {
    return Inertia::render('welcome',['translations' => [ 
        'home' => Lang::get('WelcomeTrans'), 
        'navbar' => Lang::get('HeaderTrans') 
    ]]);
})->name('home');

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register');
})->name('register');

Route::middleware(['ensureToken'])->group(function () {
    Route::get('profile', [ViewController::class, 'profilePage'])->name('profile.view');
});


Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('products')->group(function() {
        Route::get('category', [ViewController::class, 'categoryPage']);
        Route::get('unit', [ViewController::class, 'unitPage']);
        Route::get('tags', [ViewController::class, 'tagsPage']);
    });
});