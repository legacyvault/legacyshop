<?php

use App\Http\Controllers\API\V1\AWSCognitoAuthController;
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

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken', 'role:admin']], function () {
    //Location API
    Route::get('province-list', [LocationController::class, 'getProvinceList'])->name('province.list');
    Route::get('city-list/{geonameId}', [LocationController::class, 'getCitiesList'])->name('cities.list');
    Route::get('postal-code-list/{cityName}', [LocationController::class, 'getPostalCodeList'])->name('postal_code.list');

    //Product API
    Route::post('add-product', [ProductController::class, 'addProduct'])->name('product.add-product');
    Route::post('update-product', [ProductController::class, 'editProduct'])->name('product.edit-product');
    Route::get('products', [ProductController::class, 'getAllProduct'])->name('products');
    Route::post('add-product-stock', [ProductController::class, 'addStock'])->name('product.add-stock');
    Route::post('update-product-stock', [ProductController::class, 'updateLatestStock'])->name('product.update-stock');
    Route::get('product/{id}', [ProductController::class, 'getProductByID'])->name('product.id');

    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile'])->name('profile.edit');
    Route::get('profile', [UserController::class, 'getProfile'])->name('profile.edit-view');
    Route::post('create-delivery-address', [UserController::class, 'createDeliveryAddress'])->name('create.delivery-address');

    //Category API
    Route::post('create-category', [ProductController::class, 'createCategory'])->name('category.create');
    Route::post('update-category', [ProductController::class, 'updateCategory'])->name('category.update');
    Route::get('category', [ProductController::class, 'getAllCategory'])->name('category');
    Route::get('category/{id}', [ProductController::class, 'getCategoryById'])->name('category.id');

    //Type API
    Route::post('create-type', [ProductController::class, 'createType'])->name('type.create');
    Route::post('update-type', [ProductController::class, 'updateType'])->name('type.update');
    Route::get('type', [ProductController::class, 'getAllType'])->name('type');

    //Tags API
    Route::post('create-tag', [ProductController::class, 'createTag'])->name('tag.create');
    Route::post('update-tag', [ProductController::class, 'updateTag'])->name('tag.update');
    Route::get('tag', [ProductController::class, 'getAllTags'])->name('tag');


    //Unit API
    Route::prefix('products')->group(function () {
        Route::get('unit', [ProductController::class, 'getAllUnit'])->name('unit');
    });

    Route::post('create-unit', [ProductController::class, 'createUnit'])->name('unit.create');
    Route::post('update-unit', [ProductController::class, 'updateUnit'])->name('unit.update');

    //Subcat API
    Route::post('create-sub-category', [SubCategoryController::class, 'createSubCategory'])->name('subcat.create');
    Route::post('update-sub-category', [SubCategoryController::class, 'updateSubCategory'])->name('subcat.update');
    Route::get('sub-category', [SubCategoryController::class, 'getAllSubCategory'])->name('subcat');
    Route::post('add-subcat-stock', [SubCategoryController::class, 'addStock'])->name('subcat.add-stock');
    Route::post('update-subcat-stock', [SubCategoryController::class, 'updateLatestStock'])->name('subcat.update-stock');
    Route::get('sub-category/{id}', [SubCategoryController::class, 'getSubCategoryById'])->name('subcat.id');

    //Division API
    Route::post('create-division', [DivisionController::class, 'createDivision'])->name('division.create');
    Route::post('update-division', [DivisionController::class, 'updateDivision'])->name('division.update');
    Route::get('division', [DivisionController::class, 'getAllDivision'])->name('division');
    Route::post('add-division-stock', [DivisionController::class, 'addStock'])->name('division.add-stock');
    Route::post('update-division-stock', [DivisionController::class, 'updateLatestStock'])->name('division.update-stock');
    Route::get('division/{id}', [DivisionController::class, 'getDivisionById'])->name('division.id');

    //Variant API
    Route::post('create-variant', [VariantController::class, 'createVariant'])->name('variant.create');
    Route::post('update-variant', [VariantController::class, 'updateVariant'])->name('variant.update');
    Route::get('variant', [VariantController::class, 'getAllVariant'])->name('variant');
    Route::post('add-variant-stock', [VariantController::class, 'addStock'])->name('variant.add-stock');
    Route::post('update-variant-stock', [VariantController::class, 'updateLatestStock'])->name('variant.update-stock');
    Route::get('variant/{id}', [VariantController::class, 'getVariantById'])->name('variant.id');
});

Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {
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
    return Inertia::render('welcome', ['translations' => [
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

    Route::prefix('products')->group(function () {
        Route::get('category', [ViewController::class, 'categoryPage']);
        Route::get('unit', [ViewController::class, 'unitPage']);
        Route::get('tags', [ViewController::class, 'tagsPage']);

        //PRODUCT ROUTES
        Route::get('product', [ViewController::class, 'productPage']);
        Route::get('add-product/{id?}', [ViewController::class, 'addProdPage']);

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
