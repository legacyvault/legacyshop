<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\AwsS3;
use App\Models\Article;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    use AwsS3;

    public function createArticle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'         => ['required', 'string', 'max:255'],
            'slug'          => ['nullable', 'string', 'max:255', 'unique:articles,slug'],
            'content'       => ['required', 'array'],
            'content_html'  => ['nullable', 'string'],
            'is_published'  => ['boolean'],
            'published_at'  => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            Article::create([
                'title'        => $request->title,
                'slug'         => $request->slug,
                'content'      => $request->content,
                'content_html' => $request->content_html,
                'is_published' => $request->boolean('is_published'),
                'published_at' => $request->published_at,
            ]);

            DB::commit();

            return redirect()->route('admin-articles')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully create article.',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('ERROR: Failed to create article: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to create article.',
            ]);
        }
    }

    public function updateArticle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id'            => 'required|exists:articles,id',
            'title'         => ['required', 'string', 'max:255'],
            'slug'          => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('articles', 'slug')->ignore($request->id)
            ],
            'content'       => ['required', 'array'],
            'content_html'  => ['nullable', 'string'],
            'is_published'  => ['boolean'],
            'published_at'  => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
            $article = Article::findOrFail($request->id);

            $article->update([
                'title'         => $request->title,
                'slug'          => $request->slug,
                'content'       => $request->content,
                'content_html'  => $request->content_html,
                'is_published'  => $request->boolean('is_published'),
                'published_at'  => $request->published_at,
            ]);

            DB::commit();

            return redirect()->route('admin-articles')->with('alert', [
                'type' => 'success',
                'message' => 'Successfully update article.',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('ERROR: Failed to update article: ' . $e);
            return back()->with('alert', [
                'type' => 'error',
                'message' => 'Failed to update article.',
            ]);
        }
    }

    public function getAllArticle()
    {
        $data = Article::orderBy('created_at', 'desc')->get();

        return $data;
    }

    public function getArticleById($id)
    {
        $data = Article::find($id);

        return $data;
    }

    public function uploadArticleImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:4096'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid image uploaded.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $url = $this->uploadArticleImageToS3($request->file('image'));
            
            return response()->json(['url' => $url]);
        } catch (Exception $e) {
            Log::error('Upload article image failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to upload article image.',
            ], 500);
        }
    }
}
