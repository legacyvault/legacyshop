<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Lang;

class ViewController extends Controller
{

    protected $productController;
    protected $userController;
    protected $subcategoryController;
    protected $divisionController;
    protected $variantController;

    public function __construct(Request $request)
    {
        $this->productController = new ProductController();
        $this->userController = new UserController($request);
        $this->subcategoryController = new SubCategoryController();
        $this->divisionController = new DivisionController();
        $this->variantController = new VariantController();
    }
    
    public function unitPage(){

        $units = $this ->productController->getAllUnit();

        return Inertia::render('products/unit/index', [
            'units' => $units
        ]);
    }

    public function categoryPage(){
        $units = $this ->productController->getAllUnit();
        $categories = $this->productController->getAllCategory();

        return Inertia::render('products/category/index', [
            'units' => $units,
            'categories' => $categories
        ]);
    }

    public function profilePage(){
        $profile = $this->userController->getProfile();

        return Inertia::render('profile/index', [
            'profile' => $profile,
            'translations' => [        
                'home' => Lang::get('WelcomeTrans'), 
                'navbar' => Lang::get('HeaderTrans') 
            ]
        ]);
    }

    public function tagsPage(){
        $tags = $this->productController->getAllTags();

        return Inertia::render('products/tags/index', [
            'tags' => $tags
        ]);
    }

    public function subcatPage(){
        $subcat = $this->subcategoryController->getAllSubCategory();

        return Inertia::render('products/subcategory/index', [
            'subcats' => $subcat
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

    public function divisionPage(){
        $division = $this->divisionController->getAllDivision();

        return Inertia::render('products/division/index', [
            'divisions' => $division
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

    public function variantPage(){
        $variant = $this->variantController->getAllVariant();

        return Inertia::render('products/variant/index', [
            'variants' => $variant
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



}
