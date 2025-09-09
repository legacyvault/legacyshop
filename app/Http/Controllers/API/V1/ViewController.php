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

    public function __construct(Request $request)
    {
        $this->productController = new ProductController();
        $this->userController = new UserController($request);
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
}
