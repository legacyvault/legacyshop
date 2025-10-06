<?php

use App\Http\Controllers\API\V1\ArticleController;
use App\Http\Controllers\API\V1\AWSCognitoAuthController;
use App\Http\Controllers\API\V1\BiteshipController;
use App\Http\Controllers\API\V1\CartsController;
use App\Http\Controllers\API\V1\LocationController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\ViewController;
use App\Http\Controllers\API\V1\DivisionController;
use App\Http\Controllers\API\V1\MiscController;
use App\Http\Controllers\API\V1\SubCategoryController;
use App\Http\Controllers\API\V1\VariantController;
use App\Http\Controllers\API\V1\WarehouseController;
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
Route::group(['prefix' => 'v1'], function () {
    Route::get('active-running-text', [MiscController::class, 'getActiveRunningText'])->name('active.running-text');
    Route::get('active-banner', [MiscController::class, 'getActiveBanner'])->name('active.banner');
});


Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {
    //Biteship API
    Route::get('all-warehouse', [WarehouseController::class, 'getAllWarehouse'])->name('warehouses');
    Route::get('active-warehouse', [WarehouseController::class, 'getActiveWarehouse'])->name('warehouse.active');
    Route::get('biteship/origin/{origin_id}', [BiteshipController::class, 'getBiteshipOriginWarehouse'])->name('origin.location');
    Route::get('courier-list', [BiteshipController::class, 'getCourierList'])->name('courier.list');
    Route::post('delivery-rates', [BiteshipController::class, 'getDeliveryRates'])->name('delivery.rates');

    //Location API
    Route::get('province-list', [LocationController::class, 'getProvinceList'])->name('province.list');
    Route::get('city-list/{geonameId}', [LocationController::class, 'getCitiesList'])->name('cities.list');
    Route::get('postal-code-list/{cityName}', [LocationController::class, 'getPostalCodeList'])->name('postal_code.list');

    //Product API
    Route::get('product/{id}', [ProductController::class, 'getProductByID'])->name('product.id');
    Route::get('products', [ProductController::class, 'getAllProduct'])->name('products');
    Route::get('products-showcase', [ProductController::class, 'getAllShowcaseProduct'])->name('products.showcase');

    //Running Text API
    Route::get('running-text', [MiscController::class, 'getAllRunningText'])->name('running-text');

    //Banner API
    Route::get('all-banner', [MiscController::class, 'getAllBanner'])->name('all-banner');

    //Article API
    Route::get('all-article', [ArticleController::class, 'getAllArticle'])->name('all-article');
    Route::get('article/{id}', [ArticleController::class, 'getArticleById'])->name('article.id');

    //Carts API
    Route::post('add-cart', [CartsController::class, 'addToCart'])->name('add.cart');
    Route::get('carts/{id}', [CartsController::class, 'getCart'])->name('get.cart');

    //Profile API
    Route::post('update-profile', [UserController::class, 'updateProfile'])->name('profile.edit');
    Route::get('profile', [UserController::class, 'getProfile'])->name('profile.edit-view');
    Route::post('create-delivery-address', [UserController::class, 'createDeliveryAddress'])->name('create.delivery-address');
    Route::post('update-delivery-address', [UserController::class, 'updateDeliveryAddress'])->name('update.delivery-address');
    Route::get('delivery-address', [UserController::class, 'getAllDeliveryAddress'])->name('all.delivery-address');
    Route::get('active-delivery-address', [UserController::class, 'getActiveDeliveryAddress'])->name('active.delivery-address');
    Route::get('biteship/destination/{destination_id}', [BiteshipController::class, 'getBiteshipDestinationID'])->name('destination.location');

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

    //Warehouse API
    Route::post('create-warehouse', [WarehouseController::class, 'createWarehouse'])->name('create.warehouse');
    Route::post('update-warehouse', [WarehouseController::class, 'updateWarehouse'])->name('update.warehouse');

    //Product API
    Route::post('add-product', [ProductController::class, 'addProduct'])->name('product.add-product');
    Route::post('update-product/{id}', [ProductController::class, 'editProduct'])->name('product.edit-product');

    Route::post('add-product-stock', [ProductController::class, 'addStock'])->name('product.add-stock');
    Route::post('update-product-stock', [ProductController::class, 'updateLatestStock'])->name('product.update-stock');

    //RunningText API
    Route::post('add-running-text', [MiscController::class, 'createRunningText'])->name('add-runningtext');
    Route::post('update-running-text', [MiscController::class, 'updateRunningText'])->name('edit-runningtext');

    //Banner API
    Route::post('add-banner', [MiscController::class, 'createBanner'])->name('add-banner');
    Route::post('update-banner', [MiscController::class, 'updateBanner'])->name('edit-banner');

    //Article API
    Route::post('create-article', [ArticleController::class, 'createArticle'])->name('create-article');
    Route::post('update-article', [ArticleController::class, 'updateArticle'])->name('edit-article');
    Route::post('upload-article-img', [ArticleController::class, 'uploadArticleImage'])->name('upload-article-img');

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

Route::get('/articles', [ViewController::class, 'frontArticlesPage'])->name('front.articles');
Route::get('/articles/{slug}', [ViewController::class, 'frontArticleView'])->name('front.articles-view');

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register');
})->name('register');

Route::get('/list-products', [ViewController::class, 'frontListProducts']);

Route::get('/view-product/{id}', [ViewController::class, 'frontViewProduct']);

Route::get('view-cart/{id?}', [ViewController::class, 'cartPage'])->name('page.cart');
Route::get('checkout', [ViewController::class, 'checkoutPage']);

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

    Route::prefix('misc')->group(function () {
        Route::redirect('/', '/misc/view-running-text');
        Route::get('view-running-text', [ViewController::class, 'runningTextPage']);
        Route::get('view-banner', [ViewController::class, 'bannerPage']);
    });

    Route::prefix('admin-articles')->group(function () {
        Route::get('/', [ViewController::class, 'adminArticlePage'])->name('admin-articles');
        Route::get('/add-articles/{id?}', [ViewController::class, 'addArticlePage']);
        Route::get('/view-articles/{id}', [ViewController::class, 'viewArticlePage']);
    });

    Route::prefix('warehouse')->group(function () {
        Route::get('/', [ViewController::class, 'warehousePage']);
        Route::get('add-warehouse/{id?}', [ViewController::class, 'addWarehousePage']);
    });
});
