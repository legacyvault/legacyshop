<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderHistoryController;
use App\Http\Controllers\InvoiceController as AppInvoiceController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;
use App\Models\Carts;
use App\Models\Unit;
use Illuminate\Support\Facades\Auth;

class ViewController extends Controller
{

    protected $productController;
    protected $userController;
    protected $subcategoryController;
    protected $divisionController;
    protected $variantController;
    protected $cartController;
    protected $miscController;
    protected $articleController;
    protected $warehouseController;
    protected $locationController;
    protected $biteshipController;
    protected $orderhistoryController;
    protected $invoiceController;
    protected $internationalShipmentController;

    public function __construct(Request $request)
    {
        $this->productController = new ProductController();
        $this->userController = new UserController($request);
        $this->subcategoryController = new SubCategoryController();
        $this->divisionController = new DivisionController();
        $this->variantController = new VariantController();
        $this->cartController = new CartsController();
        $this->miscController = new MiscController();
        $this->articleController = new ArticleController();
        $this->warehouseController = new WarehouseController();
        $this->locationController = new LocationController();
        $this->biteshipController = new BiteshipController();
        $this->orderhistoryController= new OrderHistoryController();
        $this->invoiceController = new AppInvoiceController();
        $this->internationalShipmentController = new InternationalShipment();
    }

    public function unitPage(Request $request)
    {
        $unitsPaginated = $this->productController->getUnitPaginated($request);

        return Inertia::render('products/unit/index', [
            'unitsPaginated' => $unitsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function subUnitPage(Request $request){
        $units = $this->productController->getAllUnit();
        $sub_unitsPaginated = $this->productController->getSubUnitPaginated($request);

        return Inertia::render('products/subunits/index', [
            'units' => $units,
            'subunitsPaginated' => $sub_unitsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function categoryPage(Request $request)
    {
        $sub_units = $this->productController->getAllSubUnit();
        $categoriesPaginated = $this->productController->getCategoryPaginated($request);

        return Inertia::render('products/category/index', [
            'subunits' => $sub_units,
            'categoriesPaginated' => $categoriesPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function profilePage()
    {
        $profile = $this->userController->getProfile();

        return Inertia::render('profile/index', [
            'profile' => $profile,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function welcomePage()
    {
        $productsTop = $this->productController->getAllShowcaseTopProduct();
        $productsBottom = $this->productController->getAllShowcaseBottomProduct();
        $units = $this->productController->getAllActiveUnit();
        $banner = $this->miscController->getActiveBanner();
        $articles = $this->articleController->getNewestArticle();

        return Inertia::render('welcome', [
            'productsTop' => $productsTop,
            'productsBottom' => $productsBottom,
            'units' => $units,
            'banner' => $banner,
            'articles' => $articles,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function tagsPage(Request $request)
    {
        $tagsPaginated = $this->productController->getTagsPaginated($request);

        return Inertia::render('products/tags/index', [
            'tagsPaginated' => $tagsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function subcatPage(Request $request)
    {
        $subcatsPaginated = $this->subcategoryController->getSubCategoryPaginated($request);

        return Inertia::render('products/subcategory/index', [
            'subcatsPaginated' => $subcatsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function addSubcatPage($id = null)
    {
        $selectedSubCat = null;
        $categories = $this->productController->getAllCategory();

        if ($id) {
            $selectedSubCat = $this->subcategoryController->getSubCategoryById($id);
        }

        return Inertia::render('products/subcategory/add-subcategory', [
            'id' => $id,
            'subcat' => $selectedSubCat,
            'categories' => $categories
        ]);
    }

    public function viewSubcatPage($id)
    {
        $selectedSubCat = $this->subcategoryController->getSubCategoryById($id);
        return Inertia::render('products/subcategory/view-subcategory', [
            'subcat' => $selectedSubCat
        ]);
    }

    public function divisionPage(Request $request)
    {
        $divisionsPaginated = $this->divisionController->getDivisionPaginated($request);

        return Inertia::render('products/division/index', [
            'divisionsPaginated' => $divisionsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function addDivPage($id = null)
    {
        $selectedDiv = null;
        $subcats = $this->subcategoryController->getAllSubCategory();

        if ($id) {
            $selectedDiv = $this->divisionController->getDivisionById($id);
        }

        return Inertia::render('products/division/add-division', [
            'id' => $id,
            'division' => $selectedDiv,
            'subcats' => $subcats
        ]);
    }

    public function viewDivPage($id)
    {
        $selectedDivision = $this->divisionController->getDivisionById($id);
        return Inertia::render('products/division/view-division', [
            'division' => $selectedDivision
        ]);
    }

    public function variantPage(Request $request)
    {
        $variantsPaginated = $this->variantController->getVariantPaginated($request);

        return Inertia::render('products/variant/index', [
            'variantsPaginated' => $variantsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function addVarPage($id = null)
    {
        $selectedVar = null;
        $divisions = $this->divisionController->getAllDivision();

        if ($id) {
            $selectedVar = $this->variantController->getVariantById($id);
        }

        return Inertia::render('products/variant/add-variant', [
            'id' => $id,
            'divisions' => $divisions,
            'variant' => $selectedVar
        ]);
    }

    public function viewVarPage($id)
    {
        $selectedVariant = $this->variantController->getVariantById($id);
        return Inertia::render('products/variant/view-variant', [
            'variant' => $selectedVariant
        ]);
    }

    public function productPage(Request $request)
    {
        $product = $this->productController->getAllProduct($request);

        return Inertia::render('products/product/index', [
            'products' => $product,
            'filters'  => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page'),
        ]);
    }

    public function addProdPage($id = null)
    {
        $units = $this->productController->getAllUnit();
        $subunits = $this->productController->getAllSubUnit();
        $categories = $this->productController->getAllCategory();
        $subcats = $this->subcategoryController->getAllSubCategory();
        $divisions = $this->divisionController->getAllDivision();
        $variants = $this->variantController->getAllVariant();
        $tags = $this->productController->getAllTags();

        $selectedProd = null;

        if ($id) {
            $selectedProd = $this->productController->getProductByID($id);
        }

        return Inertia::render('products/product/add-product', [
            'units' => $units,
            'subunits' => $subunits,
            'categories' => $categories,
            'subcats' => $subcats,
            'divisions' => $divisions,
            'variants' => $variants,
            'tags' => $tags,
            'id' => $id,
            'product' => $selectedProd,
        ]);
    }

    public function viewProdPage($id)
    {
        $selectedProd = $this->productController->getProductByID($id);

        return Inertia::render('products/product/view-product', [
            'product' => $selectedProd
        ]);
    }

    public function frontListProducts(Request $request, $unitId = null)
    {
        $unit = null;

        if ($unitId) {
            $unit = Unit::with('sub_unit.categories')->find($unitId);

            if (!$unit) {
                abort(404);
            }

            $request->merge(['unit_id' => $unitId]);
        }

        $products = $this->productController->getAllProduct($request, $unitId);
        $subunits = $this->productController->getAllSubUnit($unitId);
        $tags = $this->productController->getAllTags();

        return Inertia::render('front/products/index', [
            'products' => $products,
            'subunits' => $subunits,
            'tags' => $tags,
            'unit' => $unit,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page', 'sub_unit_ids', 'tag_ids', 'unit_id'),
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ],
        ]);
    }

    public function frontViewProduct($id)
    {
        $selectedProd = $this->productController->getProductByID($id);
        $reccomendationProd = $this->productController->getRecommendationProduct($id);

        return Inertia::render('front/products/product-detail', [
            'product' => $selectedProd,
            'rec_prod' => $reccomendationProd,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ],
        ]);
    }

    public function cartPage(Request $request, $id = null)
    {

        $carts = null;

        if (Auth::check()) {
            if ((int) Auth::id() === (int) $id) {
                $carts = Carts::with([
                    'product',
                    'product.unit',
                    'product.categories',
                    'product.subcategories',
                    'product.divisions',
                    'product.variants',
                    'product.pictures',
                    'category',
                    'subCategory',
                    'division',
                    'variant',
                ])
                    ->where('user_id', $id)
                    ->get();
            }
        }

        return Inertia::render('front/carts/index', [
            'id' => $id,
            'carts' => $carts,
            'filters'  => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page'),
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans'),
            ],
        ]);
    }

    public function runningTextPage(){
        $runningText = $this->miscController->getAllRunningText();

        return Inertia::render('misc/running-text', [
            'runningText' => $runningText,
        ]);
    }

    public function bannerPage(){
        $banner = $this->miscController->getAllBanner();

        return Inertia::render('misc/banner', [
            'banner' => $banner
        ]);
    }

    public function frontArticlesPage()
    {  
       $articles = $this->articleController->getAllArticle(); 
        return Inertia::render('front/articles/index', [
            'articles' => $articles,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function frontArticleView($slug)
    {
        $article = $this->articleController->getArticleBySlug($slug);

        if (!$article) {
            abort(404);
        }

        return Inertia::render('front/articles/view-article', [
            'article' => $article,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function adminArticlePage(){
        $articles = $this->articleController->getAllArticle();
        return Inertia::render('articles/index', [
            'articles' => $articles
        ]);
    }

    public function addArticlePage($id = null){
        $article = null;

        if ($id) {
            $article = $this->articleController->getArticleById($id);
        }

        return Inertia::render('articles/add-articles', [
            'id' => $id,
            'article' => $article,
        ]);
    }

    public function viewArticlePage($id){
        $article = $this->articleController->getArticleById($id);
        return Inertia::render('articles/view-articles', [
            'article' => $article
        ]);
    }

    public function checkoutPage(){
        $warehouse = $this->warehouseController->getActiveWarehouse();
        $couriers = $this->biteshipController->getCourierList();
        $profile = $this->userController->getProfile();

        return Inertia::render('front/checkout/index',[
            'profile' => $profile,
            'warehouse' => $warehouse,
            'couriers' => $couriers,
            'rates'             => fn () => session('rates', []),
            'flashMessage'      => fn () => session('message'),
        ]);
    }

    public function warehousePage(){
        $warehouse = $this->warehouseController->getAllWarehouse();
        return Inertia::render('warehouse/index', [
            'warehouses' =>  $warehouse
        ]);
    }

    public function addWarehousePage($id = null){
        $warehouse = null;

        if($id !== null){
            $warehouse = $this->warehouseController->getWarehouseById($id);
        }

        return Inertia::render('warehouse/add-warehouse', [
           'id' => $id,
           'warehouse' => $warehouse
        ]);
    }

    public function deliveryAddressProfilePage(){
        $provinces = $this->locationController->getProvinceList();
        $profile = $this->userController->getProfile();

        return Inertia::render('settings/delivery-address/index', [
            'provinces' => $provinces,
            'profile' => $profile,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function deliveryAddressProfileAddPage($id = null){
        $provinces = $this->locationController->getProvinceList();
        
        $deliveryAddress = null;
        
        if($id !== null){
            $deliveryAddress = $this->userController->getDeliveryAddressById($id);
        };

        return Inertia::render('settings/delivery-address/add-delivery-address', [
            'id' => $id,
            'provinces' => $provinces,
            'deliveryAddress' => $deliveryAddress,
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function OrdersPage(Request $request){

        $ordersPaginated = $this->orderhistoryController->getAllOrderHistory($request);

        return Inertia::render('orders/index', [
            'ordersPaginated' => $ordersPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page', 'status', 'payment_status', 'transaction_status', 'created_from', 'created_to')
        ]);
    }

    public function orderSummaryPage(Request $request){
        $orderItemsPaginated = $this->orderhistoryController->getOrderItemsSummary($request);

        return Inertia::render('orders/summary/index', [
            'orderItemsPaginated' => $orderItemsPaginated,
            'filters' => $request->only('q', 'per_page', 'page', 'date_from', 'date_to'),
        ]);
    }

    public function purchasesPage(Request $request){

        $ordersPaginated = $this->orderhistoryController->getUserOrderHistory($request);

        return Inertia::render('settings/purchases/index', [
            'ordersPaginated' => $ordersPaginated,
            'filters' => $request->only('q', 'status', 'payment_status', 'transaction_status', 'product_category', 'page', 'per_page'),
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ]
        ]);
    }

    public function invoicePage(Request $request){
        $filters = $request->only('q', 'status', 'per_page', 'page', 'sort_by', 'sort_dir', 'issued_from', 'issued_to');
        $invoicesPaginated = $this->invoiceController->index($request);

        return Inertia::render('orders/invoice/index', [
            'invoicesPaginated' => $invoicesPaginated,
            'filters' => $filters,
        ]);
    }

    public function shipmentInternationalPage(){
        $international_shipment = $this->internationalShipmentController->getAllInternationalShipment();
        return Inertia::render('shipment/international/index', [
            'international_shipment' => $international_shipment
        ]);
    }

    public function groupProductPage(Request $request){
        $productGroupsPaginated = $this->productController->getProductGroupsPaginated($request);

        return Inertia::render('products/product/group', [
            'productGroupsPaginated' => $productGroupsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page'),
        ]);
    }

    public function groupProductFormPage($id = null)
    {
        $units = $this->productController->getAllUnit();
        $subunits = $this->productController->getAllSubUnit();
        $categories = $this->productController->getAllCategory();
        $subcats = $this->subcategoryController->getAllSubCategory();
        $divisions = $this->divisionController->getAllDivision();
        $variants = $this->variantController->getAllVariant();
        $tags = $this->productController->getAllTags();

        $productGroup = null;

        if ($id) {
            $productGroup = $this->productController->getProductGroupById($id, true);

            if (!$productGroup) {
                abort(404);
            }
        }

        return Inertia::render('products/product/group-form', [
            'id' => $id,
            'units' => $units,
            'subunits' => $subunits,
            'categories' => $categories,
            'subcats' => $subcats,
            'divisions' => $divisions,
            'variants' => $variants,
            'tags' => $tags,
            'productGroup' => $productGroup,
        ]);
    }

    public function groupProductViewPage($id)
    {
        $productGroup = $this->productController->getProductGroupById($id, true);

        if (!$productGroup) {
            abort(404);
        }

        return Inertia::render('products/product/view-group', [
            'productGroup' => $productGroup,
        ]);
    }
}
