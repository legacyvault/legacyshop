<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ViewController extends Controller
{

    protected $productController;

    public function __construct()
    {
        $this->productController = new ProductController();
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
}
