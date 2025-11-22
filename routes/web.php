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
use App\Http\Controllers\API\V1\SummaryController;
use App\Http\Controllers\API\V1\VariantController;
use App\Http\Controllers\API\V1\WarehouseController;
use App\Http\Controllers\API\V1\OrderController;
use App\Http\Controllers\API\V1\NotificationController;
use App\Http\Controllers\OrderHistoryController;
use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;

Route::middleware(['ensureToken', 'role:admin'])->group(function () {
    Route::get('/dashboard', [SummaryController::class, 'dashboard'])->name('dashboard');
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
    Route::post('delivery-rates', [BiteshipController::class, 'getDeliveryRates'])->name('delivery.rates');

    //Checkout API
    Route::post('checkout/order', [OrderController::class, 'checkout'])->name('order.checkout');
});

Route::group(['prefix' => 'v1/public'], function () {
    Route::get('public-province-list/{country}', [LocationController::class, 'getProvincePublicList'])->name('public.province.list');
    Route::get('public-city-list/{country}/{province}', [LocationController::class, 'getPublicCityList'])->name('public.cities.list');
    Route::get('district-list/{city}', [LocationController::class, 'getPublicDistrictList'])->name('public.districts.list');
    Route::get('village-list/{district}', [LocationController::class, 'getPublicVillageList'])->name('public.villages.list');
    Route::get('postal-code-list/{location}', [LocationController::class, 'getPublicPostalCodeList'])->name('public.postal_code.list');
});


Route::group(['prefix' => 'v1', 'middleware' => ['ensureToken']], function () {

    //History
    Route::get('order-history', [OrderHistoryController::class, 'getUserOrderHistory'])->name('user.order-history');

    //Checkout API
    Route::get('transaction-status/{transaction_id}', [OrderController::class, 'getTransactionStatus'])->name('transaction.status');
    Route::get('reopen-snap/{order_number}', [OrderController::class, 'reopenSnapPayment'])->name('snap.reopen');
    //Biteship API
    Route::get('all-warehouse', [WarehouseController::class, 'getAllWarehouse'])->name('warehouses');
    Route::get('active-warehouse', [WarehouseController::class, 'getActiveWarehouse'])->name('warehouse.active');
    Route::get('biteship/origin/{origin_id}', [BiteshipController::class, 'getBiteshipOriginWarehouse'])->name('origin.location');
    Route::get('courier-list', [BiteshipController::class, 'getCourierList'])->name('courier.list');
    Route::post('delivery-rates/location-id', [BiteshipController::class, 'getDeliveryRatesByLocationID'])->name('delivery.rates.location');

    //Location API
    Route::get('province-list', [LocationController::class, 'getProvinceList'])->name('province.list');
    Route::get('city-list/{geonameId}', [LocationController::class, 'getCitiesList'])->name('cities.list');
    Route::get('district-list/{cityCode}', [LocationController::class, 'getDistrictList'])->name('districts.list');
    Route::get('village-list/{districtCode}', [LocationController::class, 'getVillageList'])->name('villages.list');
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

    Route::get('sub-unit', [ProductController::class, 'getAllSubUnit'])->name('sub-unit');
    Route::get('sub-unit/{id}', [ProductController::class, 'getSubUnitById'])->name('subunit.id');


    Route::get('type', [ProductController::class, 'getAllType'])->name('type');

    Route::get('tag', [ProductController::class, 'getAllTags'])->name('tag');

    //Unit API
    Route::prefix('products')->group(function () {
        Route::get('unit', [ProductController::class, 'getAllUnit'])->name('unit');
        Route::get('active-unit', [ProductController::class, 'getAllActiveUnit'])->name('active-unit');
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

    Route::post('confirm-order/{id}', [OrderController::class, 'confirmOrder'])->name('confirm.order');

    //Notification API
    Route::get('notifications/low-stock', [NotificationController::class, 'lowStock'])->name('notifications.low-stock');

    //History
    Route::get('all-order-history', [OrderHistoryController::class, 'getAllOrderHistory'])->name('all.order-history');

    //Warehouse API
    Route::post('create-warehouse', [WarehouseController::class, 'createWarehouse'])->name('create.warehouse');
    Route::post('update-warehouse', [WarehouseController::class, 'updateWarehouse'])->name('update.warehouse');

    //Product API
    Route::get('products/options', [ProductController::class, 'getProductOptions'])->name('products.options');
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

    //SubUnit API
    Route::post('create-subUnit', [ProductController::class, 'createSubUnit'])->name('subunit.create');
    Route::post('update-subUnit', [ProductController::class, 'updateSubUnit'])->name('subunit.update');

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

    //Invoice API
    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
    Route::get('invoices/{invoice}/download', [InvoiceController::class, 'download'])->name('invoices.download');
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
Route::get('checkout', [ViewController::class, 'checkoutPage'])->name('checkout.page');

Route::middleware(['ensureToken'])->group(function () {
    Route::prefix('settings')->group(function () {
        Route::get('profile', [ViewController::class, 'profilePage'])->name('profile.view');
        Route::get('delivery-address-profile', [ViewController::class, 'deliveryAddressProfilePage'])->name('profile.deliveryaddress.view');
        Route::get('add-delivery-address-profile/{id?}', [ViewController::class, 'deliveryAddressProfileAddPage'])->name('profile.deliveryaddress.add');
        Route::get('purchases', [ViewController::class, 'purchasesPage'])->name('profile.purchases');
    });
});


Route::middleware(['ensureToken', 'role:admin'])->group(function () {

    Route::get('/dashboard', [SummaryController::class, 'dashboard'])->name('dashboard');

    Route::prefix('orders')->group(function () {
        Route::redirect('/', '/orders/order');
        Route::get('order', [ViewController::class, 'OrdersPage']);
        Route::get('invoice', [ViewController::class, 'invoicePage'])->name('orders.invoice');
    });

    Route::prefix('products')->group(function () {
        Route::get('sub_unit', [ViewController::class, 'subUnitPage']);
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
        Route::get('/', [ViewController::class, 'warehousePage'])->name('warehouse-admin.view');
        Route::get('add-warehouse/{id?}', [ViewController::class, 'addWarehousePage']);
    });
});

use Barryvdh\DomPDF\Facade\Pdf;

/*
|--------------------------------------------------------------------------
| DEV ROUTES – SHIPPING LABEL PREVIEW
|--------------------------------------------------------------------------
| Route ini HANYA untuk development / debug tampilan shipping label.
| Tidak perlu lewat flow checkout, Midtrans, Biteship, dll.
*/

Route::get('/dev/shipping-label-preview', function () {
    // STATIC DATA (dummy)
    $order = (object) [
        'order_number' => 'ORD-TEST-12345',
        'shipping_fee' => 15000,
    ];

    $customer = (object) [
        'name' => 'John Doe',
        'contact_name' => 'John Doe',
        'contact_phone' => '081234567890',
        'profile' => (object)['phone' => '081234567890'],
    ];

    $shipment = (object)[
        'courier_name' => 'jne',
        'courier_service' => 'REG',
        'receiver_name' => 'Jane Customer',
        'receiver_phone' => '081298765432',
        'receiver_address' => 'Jl. Mawar No. 12',
        'receiver_city' => 'Jakarta Selatan',
        'receiver_province' => 'DKI Jakarta',
        'receiver_postal_code' => '12345',
    ];

    $items = [
        (object)[
            'product_name' => 'Kemeja Linen Premium',
            'category_name' => 'Fashion',
            'sub_category_name' => 'Pria',
            'division_name' => 'Atasan',
            'variant_name' => 'Beige XL',
            'product' => (object)['product_sku' => 'KMJ-LINEN-XL-BEIGE'],
            'quantity' => 1,
        ],
        (object)[
            'product_name' => 'Celana Chino Slim Fit',
            'category_name' => 'Fashion',
            'sub_category_name' => 'Pria',
            'division_name' => 'Bawahan',
            'variant_name' => 'Hitam 32',
            'product' => (object)['product_sku' => 'CHINO-SF-BLK32'],
            'quantity' => 2,
        ],
    ];

    // BARCODE (besar dan kecil – pakai DNS1D instance)
    $dns = new \Milon\Barcode\DNS1D();
    $bigBarcode   = base64_encode($dns->getBarcodePNG('12123123', 'C128', 2, 80));
    $smallBarcode = base64_encode($dns->getBarcodePNG('askdlakmsd123', 'C128', 1.6, 60));

    return view('pdf.shipping-label', [
        'order' => $order,
        'customer' => $customer,
        'shipment' => $shipment,
        'items' => $items,

        'awbNumber' => 'AWB1234567890',
        'awbBarcode' => $bigBarcode,
        'logoBase64' => '',

        'shippingFeeValue' => 15000,
        'totalWeight' => 800,
    ]);
});

Route::get('/dev/shipping-label-pdf', function () {
    // sama seperti route preview, tapi render jadi PDF
    $awbNumber        = '11002678311332';
    $receiverName     = 'Niken Nurdian Putri';
    $senderName       = 'raccharin';
    $receiverAddress  = 'Jalan H Jamhur No. 55, RT.20/RW.1, Kelurahan Gandul, Cinere (Disamping perumahan), CINERE, KOTA DEPOK, JAWA BARAT';
    $receiverCity     = 'KOTA DEPOK';
    $receiverDistrict = 'CINERE';
    $senderCity       = 'KOTA TANGERANG';
    $senderPhone      = '6285717548873';
    $weight           = 1000;
    $deadline         = '03-10-2025';
    $orderCode        = '2510034TPJWJ28';

    $dns = new \Milon\Barcode\DNS1D();
    $bigBarcode   = base64_encode($dns->getBarcodePNG($awbNumber, 'C128', 2, 80));
    $smallBarcode = base64_encode($dns->getBarcodePNG($orderCode, 'C128', 1.6, 60));

    $data = compact(
        'awbNumber',
        'receiverName',
        'senderName',
        'receiverAddress',
        'receiverCity',
        'receiverDistrict',
        'senderCity',
        'senderPhone',
        'weight',
        'deadline',
        'orderCode',
        'bigBarcode',
        'smallBarcode'
    );

    $pdf = Pdf::loadView('pdf.shipping-label', $data);

    return $pdf->stream('test.pdf');
});
