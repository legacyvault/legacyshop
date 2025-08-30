<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function createCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:category,name',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }

        $create = Category::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        if ($create) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Successfully create category.',
                    'status_code' => Response::HTTP_OK
                ]
            ];
            return response()->json($response, Response::HTTP_OK);
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to create category.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];
            return response()->json($response, Response::HTTP_FORBIDDEN);
        }
    }

    public function createType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:type,name',
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }

        $create = Type::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        if ($create) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Successfully create category.',
                    'status_code' => Response::HTTP_OK
                ]
            ];
            return response()->json($response, Response::HTTP_OK);
        } else {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Failed to create category.',
                    'status_code' => Response::HTTP_FORBIDDEN
                ]
            ];
            return response()->json($response, Response::HTTP_FORBIDDEN);
        }
    }

    public function updateCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:category,id',
            'name' => [
                'required',
                'string',
                Rule::unique('category', 'name')->ignore($request->id),
            ],
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }

        $data = Category::find($request->id);

        if (!$data) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Category not found.',
                    'status_code' => Response::HTTP_NOT_FOUND
                ]
            ];
            return response()->json($response, Response::HTTP_NOT_FOUND);
        }

        $data->name = $request->name;
        $data->description = $request->description;
        $data->save();

        $response = [
            'data' => '',
            'meta' => [
                'message' => 'Successfully update category.',
                'status_code' => Response::HTTP_OK
            ]
        ];
        return response()->json($response, Response::HTTP_OK);
    }

    public function updateType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:type,id',
            'name' => [
                'required',
                'string',
                Rule::unique('type', 'name')->ignore($request->id),
            ],
            'description' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => $validator->errors()->all()[0],
                    'status_code' => Response::HTTP_BAD_REQUEST
                ]
            ];
            return response()->json($response, Response::HTTP_BAD_REQUEST);
        }

        $data = Type::find($request->id);

        if (!$data) {
            $response = [
                'data' => '',
                'meta' => [
                    'message' => 'Type not found.',
                    'status_code' => Response::HTTP_NOT_FOUND
                ]
            ];
            return response()->json($response, Response::HTTP_NOT_FOUND);
        }

        $data->name = $request->name;
        $data->description = $request->description;
        $data->save();

        $response = [
            'data' => '',
            'meta' => [
                'message' => 'Successfully update type.',
                'status_code' => Response::HTTP_OK
            ]
        ];
        return response()->json($response, Response::HTTP_OK);
    }

    public function getAllCategory()
    {
        $data = Category::orderBy('name', 'asc')->get();

        $response = [
            'data' => $data,
            'meta' => [
                'message' => 'Successfully get all category.',
                'status_code' => Response::HTTP_OK
            ]
        ];
        return response()->json($response, Response::HTTP_OK);
    }

    public function getAllType()
    {
        $data = Type::orderBy('name', 'asc')->get();

        $response = [
            'data' => $data,
            'meta' => [
                'message' => 'Successfully get all type.',
                'status_code' => Response::HTTP_OK
            ]
        ];
        return response()->json($response, Response::HTTP_OK);
    }
}
