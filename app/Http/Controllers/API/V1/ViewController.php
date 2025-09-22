<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;
use App\Models\Carts;
use Illuminate\Support\Facades\Auth;

class ViewController extends Controller
{

    protected $productController;
    protected $userController;
    protected $subcategoryController;
    protected $divisionController;
    protected $variantController;
    protected $cartController;

    public function __construct(Request $request)
    {
        $this->productController = new ProductController();
        $this->userController = new UserController($request);
        $this->subcategoryController = new SubCategoryController();
        $this->divisionController = new DivisionController();
        $this->variantController = new VariantController();
        $this->cartController = new CartsController();
    }

    public function unitPage(Request $request)
    {
        $unitsPaginated = $this->productController->getUnitPaginated($request);

        return Inertia::render('products/unit/index', [
            'unitsPaginated' => $unitsPaginated,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page')
        ]);
    }

    public function categoryPage(Request $request)
    {
        $units = $this->productController->getAllUnit();
        $categoriesPaginated = $this->productController->getCategoryPaginated($request);

        return Inertia::render('products/category/index', [
            'units' => $units,
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

    public function welcomePage(Request $request)
    {
        // Ensure only first 5 products are fetched for the landing page
        $request->merge(['per_page' => 5]);
        $products = $this->productController->getAllProduct($request);

        return Inertia::render('welcome', [
            'products' => $products,
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

    public function frontListProducts(Request $request)
    {
        $products = $this->productController->getAllProduct($request);
        $units = $this->productController->getAllUnit();
        $categories = $this->productController->getAllCategory();
        $subcats = $this->subcategoryController->getAllSubCategory();
        $divisions = $this->divisionController->getAllDivision();
        $variants = $this->variantController->getAllVariant();

        return Inertia::render('front/products/index', [
            'products' => $products,
            'units' => $units,
            'categories' => $categories,
            'subcats' => $subcats,
            'divisions' => $divisions,
            'variants' => $variants,
            'filters' => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page', 'unit_ids', 'category_ids', 'subcat_ids', 'division_ids', 'variant_ids', 'tag_ids'),
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans')
            ],
        ]);
    }

    public function frontViewProduct($id)
    {
        $selectedProd = $this->productController->getProductByID($id);

        return Inertia::render('front/products/product-detail', [
            'product' => $selectedProd,
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
            'carts' => $carts,
            'filters'  => $request->only('q', 'per_page', 'sort_by', 'sort_dir', 'page'),
            'translations' => [
                'home' => Lang::get('WelcomeTrans'),
                'navbar' => Lang::get('HeaderTrans'),
            ],
        ]);
    }
}
