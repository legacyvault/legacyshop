<?php

use App\Http\Controllers\API\V1\AWSCognitoAuthController;
use App\Http\Controllers\API\V1\CartsController;
use App\Http\Controllers\API\V1\LocationController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\ViewController;
use App\Http\Controllers\API\V1\DivisionController;
use App\Http\Controllers\API\V1\SubCategoryController;
use App\Http\Controllers\API\V1\VariantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;

Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
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
    Route::get('product/{id}', [ProductController::class, 'getProductByID'])->name('product.id');
    Route::get('products', [ProductController::class, 'getAllProduct'])->name('products');

    //Carts API
    Route::post('add-cart', [CartsController::class, 'addToCart'])->name('add.cart');
    Route::get('carts/{id}', [CartsController::class, 'getCart'])->name('get.cart');

    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile'])->name('profile.edit');
    Route::get('profile', [UserController::class, 'getProfile'])->name('profile.edit-view');
    Route::post('create-delivery-address', [UserController::class, 'createDeliveryAddress'])->name('create.delivery-address');

    Route::get('category', [ProductController::class, 'getAllCategory'])->name('category');
    Route::get('category/{id}', [ProductController::class, 'getCategoryById'])->name('category.id');

    Route::get('type', [ProductController::class, 'getAllType'])->name('type');

    Route::get('tag', [ProductController::class, 'getAllTags'])->name('tag');

    //Unit API
    Route::prefix('products')->group(function () {
        Route::get('unit', [ProductController::class, 'getAllUnit'])->name('unit');
    });

    Route::get('sub-category', [SubCategoryController::class, 'getAllSubCategory'])->name('subcat');
    Route::get('sub-category/{id}', [SubCategoryController::class, 'getSubCategoryById'])->name('subcat.id');

    Route::get('division', [DivisionController::class, 'getAllDivision'])->name('division');
    Route::get('division/{id}', [DivisionController::class, 'getDivisionById'])->name('division.id');

    Route::get('variant', [VariantController::class, 'getAllVariant'])->name('variant');
    Route::get('variant/{id}', [VariantController::class, 'getVariantById'])->name('variant.id');

    Route::post('logout', [AwsCognitoAuthController::class, 'logout'])->name('cognito.logout');
});

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken', 'role:admin']], function () {

    //Product API
    Route::post('add-product', [ProductController::class, 'addProduct'])->name('product.add-product');
    Route::post('update-product/{id}', [ProductController::class, 'editProduct'])->name('product.edit-product');

    Route::post('add-product-stock', [ProductController::class, 'addStock'])->name('product.add-stock');
    Route::post('update-product-stock', [ProductController::class, 'updateLatestStock'])->name('product.update-stock');


    //Category API
    Route::post('create-category', [ProductController::class, 'createCategory'])->name('category.create');
    Route::post('update-category', [ProductController::class, 'updateCategory'])->name('category.update');

    //Type API
    Route::post('create-type', [ProductController::class, 'createType'])->name('type.create');
    Route::post('update-type', [ProductController::class, 'updateType'])->name('type.update');

    //Tags API
    Route::post('create-tag', [ProductController::class, 'createTag'])->name('tag.create');
    Route::post('update-tag', [ProductController::class, 'updateTag'])->name('tag.update');

    Route::post('create-unit', [ProductController::class, 'createUnit'])->name('unit.create');
    Route::post('update-unit', [ProductController::class, 'updateUnit'])->name('unit.update');

    //Subcat API
    Route::post('create-sub-category', [SubCategoryController::class, 'createSubCategory'])->name('subcat.create');
    Route::post('update-sub-category', [SubCategoryController::class, 'updateSubCategory'])->name('subcat.update');

    Route::post('add-subcat-stock', [SubCategoryController::class, 'addStock'])->name('subcat.add-stock');
    Route::post('update-subcat-stock', [SubCategoryController::class, 'updateLatestStock'])->name('subcat.update-stock');

    //Division API
    Route::post('create-division', [DivisionController::class, 'createDivision'])->name('division.create');
    Route::post('update-division', [DivisionController::class, 'updateDivision'])->name('division.update');
    Route::post('add-division-stock', [DivisionController::class, 'addStock'])->name('division.add-stock');
    Route::post('update-division-stock', [DivisionController::class, 'updateLatestStock'])->name('division.update-stock');

    //Variant API
    Route::post('create-variant', [VariantController::class, 'createVariant'])->name('variant.create');
    Route::post('update-variant', [VariantController::class, 'updateVariant'])->name('variant.update');
    Route::post('add-variant-stock', [VariantController::class, 'addStock'])->name('variant.add-stock');
    Route::post('update-variant-stock', [VariantController::class, 'updateLatestStock'])->name('variant.update-stock');
});

//CHANGE LANGUAGE
Route::get('/lang/{lang}', function ($lang) {

    if (in_array($lang, ['en', 'id'])) {
        session(['locale' => $lang]);
    }
    return back();
})->name('locale.switch');




//ROUTES
Route::get('/', [ViewController::class, 'welcomePage'])->name('home');

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register');
})->name('register');

Route::get('/list-products', [ViewController::class, 'frontListProducts']);

Route::get('/view-product/{id}', [ViewController::class, 'frontViewProduct']);

Route::middleware(['ensureToken'])->group(function () {
    Route::get('profile', [ViewController::class, 'profilePage'])->name('profile.view');
    Route::get('view-cart/{id?}', [ViewController::class, 'cartPage'])->name('page.cart');
});


Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('products')->group(function () {
        Route::get('category', [ViewController::class, 'categoryPage']);
        Route::get('unit', [ViewController::class, 'unitPage']);
        Route::get('tags', [ViewController::class, 'tagsPage']);

        //PRODUCT ROUTES
        Route::get('product', [ViewController::class, 'productPage'])->name('product');
        Route::prefix('product')->group(function () {
            Route::get('add-product/{id?}', [ViewController::class, 'addProdPage']);
            Route::get('viewprod/{id}', [ViewController::class, 'viewProdPage']);
        });

        //SUBCAT ROUTES
        Route::get('subcategory', [ViewController::class, 'subcatPage'])->name('subcategory');
        Route::prefix('subcategory')->group(function () {
            Route::get('viewsub/{id}', [ViewController::class, 'viewSubcatPage']);
            Route::get('addsub/{id?}', [ViewController::class, 'addSubcatPage']);
        });

        //DIVISION ROUTE
        Route::get('division', [ViewController::class, 'divisionPage'])->name('division');
        Route::prefix('division')->group(function () {
            Route::get('viewdiv/{id}', [ViewController::class, 'viewDivPage']);
            Route::get('adddiv/{id?}', [ViewController::class, 'addDivPage']);
        });

        //VARIANT ROUTES
        Route::get('variant', [ViewController::class, 'variantPage'])->name('variant');
        Route::prefix('variant')->group(function () {
            Route::get('viewvar/{id}', [ViewController::class, 'viewVarPage']);
            Route::get('addvar/{id?}', [ViewController::class, 'addVarPage']);
        });
    });
});
