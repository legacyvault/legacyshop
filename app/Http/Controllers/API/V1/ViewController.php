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

    public function __construct(Request $request)
    {
        $this->productController = new ProductController();
        $this->userController = new UserController($request);
        $this->subcategoryController = new SubCategoryController();
        
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
}
