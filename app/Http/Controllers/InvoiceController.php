<?php

namespace App\Http\Controllers;

use App\Http\Controllers\API\V1\OrderController as V1OrderController;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\SubCategory;
use App\Models\Division;
use App\Models\Variant;
use App\Models\InvoiceItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse|LengthAwarePaginator
    {
        $perPage = max((int) $request->input('per_page', 15), 1);
        $sortBy  = $request->input('sort_by', 'issued_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['invoice_number', 'issued_at', 'due_at', 'grand_total', 'status', 'created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'issued_at';
        }

        $query = Invoice::query()->withCount('items');

        if ($search = $request->input('q')) {
            $query->where(function ($invoiceQuery) use ($search) {
                $invoiceQuery
                    ->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('bill_to_name', 'like', "%{$search}%")
                    ->orWhere('bill_to_email', 'like', "%{$search}%");
            });
        }

        if (($status = $request->input('status')) && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($issuedFrom = $request->input('issued_from')) {
            try {
                $query->whereDate('issued_at', '>=', Carbon::parse($issuedFrom)->startOfDay());
            } catch (\Throwable $th) {
                // ignore invalid date value
            }
        }

        if ($issuedTo = $request->input('issued_to')) {
            try {
                $query->whereDate('issued_at', '<=', Carbon::parse($issuedTo)->endOfDay());
            } catch (\Throwable $th) {
                // ignore invalid date value
            }
        }

        $paginator = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                ],
            ]);
        }

        return $paginator;
    }

    public function show(Request $request, Invoice $invoice): JsonResponse|Invoice
    {
        $invoice->load('items');

        if ($request->expectsJson()) {
            return response()->json($invoice);
        }

        return $invoice;
    }

    public function store(Request $request): JsonResponse|RedirectResponse|Response
    {
        $validated = $this->validateInvoice($request);
        [$items, $subtotal] = $this->prepareItems($validated['items']);

        $discount = $this->toAmount($validated['discount_total'] ?? 0);
        $tax      = $this->toAmount($validated['tax_total'] ?? 0);
        $shipping = $this->toAmount($validated['shipping_total'] ?? 0);
        $grand    = $this->calculateGrandTotal($subtotal, $discount, $tax, $shipping);

        if ($request->boolean('preview_only')) {
            $invoiceData = [
                'invoice_number'      => $this->resolveInvoiceNumber($validated['invoice_number'] ?? null),
                'status'              => $validated['status'] ?? 'issued',
                'issued_at'           => isset($validated['issued_at']) ? Carbon::parse($validated['issued_at']) : now(),
                'due_at'              => isset($validated['due_at']) ? Carbon::parse($validated['due_at']) : null,
                'subtotal'            => $subtotal,
                'discount_total'      => $discount,
                'tax_total'           => $tax,
                'shipping_total'      => $shipping,
                'grand_total'         => $grand,
                'bill_to_name'        => $validated['bill_to_name'],
                'bill_to_email'       => $validated['bill_to_email'] ?? null,
                'bill_to_phone'       => $validated['bill_to_phone'] ?? null,
                'bill_to_address'     => $validated['bill_to_address'] ?? null,
                'bill_to_city'        => $validated['bill_to_city'] ?? null,
                'bill_to_province'    => $validated['bill_to_province'] ?? null,
                'bill_to_postal_code' => $validated['bill_to_postal_code'] ?? null,
                'bill_to_country'     => $validated['bill_to_country'] ?? null,
            ];

            /** @var Invoice $invoicePreview */
            $invoicePreview = Invoice::make($invoiceData);
            $invoicePreview->setAttribute($invoicePreview->getKeyName(), (string) Str::uuid());

            $previewItems = collect($items)->map(function (array $item) {
                return new InvoiceItem($item);
            });
            $invoicePreview->setRelation('items', $previewItems);

            $pdf = Pdf::loadView('pdf.invoice', [
                'invoice' => $invoicePreview,
            ]);

            $filename = sprintf(
                'invoice-%s-preview.pdf',
                str_replace(['/', '\\', ' '], '-', $invoicePreview->invoice_number ?? $invoicePreview->getKey())
            );

            return $pdf->download($filename);
        }

        $hasOrderColumn = Schema::hasColumn('invoices', 'order_id');
        $invoice = null;
        $orderResponse = null;

        DB::beginTransaction();
        try {
            $orderPayload = $this->resolveOrderCheckoutPayload($request, $validated, $items, $shipping);

            if ($orderPayload) {
                $orderResponse = $this->dispatchOrderCheckout($orderPayload, $request);
            }

            $orderData = is_array($orderResponse) ? ($orderResponse['order'] ?? $orderResponse) : null;
            $orderId = is_array($orderData) && isset($orderData['id']) ? $orderData['id'] : null;

            $invoiceData = [
                'invoice_number'    => $this->resolveInvoiceNumber($validated['invoice_number'] ?? null),
                'status'            => $validated['status'] ?? 'issued',
                'issued_at'         => isset($validated['issued_at']) ? Carbon::parse($validated['issued_at']) : now(),
                'due_at'            => isset($validated['due_at']) ? Carbon::parse($validated['due_at']) : null,
                'subtotal'          => $subtotal,
                'discount_total'    => $discount,
                'tax_total'         => $tax,
                'shipping_total'    => $shipping,
                'grand_total'       => $grand,
                'bill_to_name'      => $validated['bill_to_name'],
                'bill_to_email'     => $validated['bill_to_email'] ?? null,
                'bill_to_phone'     => $validated['bill_to_phone'] ?? null,
                'bill_to_address'   => $validated['bill_to_address'] ?? null,
                'bill_to_city'      => $validated['bill_to_city'] ?? null,
                'bill_to_province'  => $validated['bill_to_province'] ?? null,
                'bill_to_postal_code' => $validated['bill_to_postal_code'] ?? null,
                'bill_to_country'   => $validated['bill_to_country'] ?? null,
            ];

            if ($hasOrderColumn && $orderId) {
                $invoiceData['order_id'] = $orderId;
            }

            /** @var Invoice $invoiceInstance */
            $invoiceInstance = Invoice::create($invoiceData);
            $invoiceInstance->items()->createMany($items);

            $invoice = $invoiceInstance;

            DB::commit();
        } catch (ValidationException $validationException) {
            DB::rollBack();
            throw $validationException;
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }

        $invoice->load('items');

        if ($request->expectsJson()) {
            $response = [
                'message' => 'Invoice created successfully.',
                'data'    => $invoice,
            ];

            if (is_array($orderResponse) && isset($orderResponse['order'])) {
                $response['order'] = $orderResponse['order'];
            }

            return response()->json($response, 201);
        }

        return redirect()
            ->route('orders.invoice')
            ->with('alert', [
                'type'    => 'success',
                'message' => 'Invoice created successfully.',
            ]);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse|RedirectResponse
    {
        $validated = $this->validateInvoice($request, $invoice);

        $itemsInput = $validated['items'] ?? null;

        $result = DB::transaction(function () use ($invoice, $validated, $itemsInput) {
            $subtotal = $invoice->items()->sum('total');
            $items    = null;

            if ($itemsInput !== null) {
                [$items, $subtotal] = $this->prepareItems($itemsInput);

                $invoice->items()->delete();
                $invoice->items()->createMany($items);
            }

            $discount = $this->toAmount($validated['discount_total'] ?? $invoice->discount_total);
            $tax      = $this->toAmount($validated['tax_total'] ?? $invoice->tax_total);
            $shipping = $this->toAmount($validated['shipping_total'] ?? $invoice->shipping_total);
            $grand    = $this->calculateGrandTotal($subtotal, $discount, $tax, $shipping);

            if (isset($validated['invoice_number'])) {
                $invoice->invoice_number = $this->resolveInvoiceNumber($validated['invoice_number'], $invoice);
            }

            if (isset($validated['status'])) {
                $invoice->status = $validated['status'];
            }

            if (isset($validated['issued_at'])) {
                $invoice->issued_at = Carbon::parse($validated['issued_at']);
            }

            if (array_key_exists('due_at', $validated)) {
                $invoice->due_at = $validated['due_at'] ? Carbon::parse($validated['due_at']) : null;
            }

            $invoice->fill([
                'subtotal'          => $subtotal,
                'discount_total'    => $discount,
                'tax_total'         => $tax,
                'shipping_total'    => $shipping,
                'grand_total'       => $grand,
                'bill_to_name'      => $validated['bill_to_name'] ?? $invoice->bill_to_name,
                'bill_to_email'     => $validated['bill_to_email'] ?? $invoice->bill_to_email,
                'bill_to_phone'     => $validated['bill_to_phone'] ?? $invoice->bill_to_phone,
                'bill_to_address'   => $validated['bill_to_address'] ?? $invoice->bill_to_address,
                'bill_to_city'      => $validated['bill_to_city'] ?? $invoice->bill_to_city,
                'bill_to_province'  => $validated['bill_to_province'] ?? $invoice->bill_to_province,
                'bill_to_postal_code' => $validated['bill_to_postal_code'] ?? $invoice->bill_to_postal_code,
                'bill_to_country'   => $validated['bill_to_country'] ?? $invoice->bill_to_country,
            ]);

            $invoice->save();

            return $invoice->fresh('items');
        });

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Invoice updated successfully.',
                'data'    => $result,
            ]);
        }

        return redirect()
            ->route('orders.invoice')
            ->with('alert', [
                'type'    => 'success',
                'message' => 'Invoice updated successfully.',
            ]);
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse|RedirectResponse
    {
        $invoice->delete();

        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }

        return redirect()
            ->route('orders.invoice')
            ->with('alert', [
                'type'    => 'success',
                'message' => 'Invoice deleted successfully.',
            ]);
    }

    public function download(Invoice $invoice)
    {
        $invoice->load('items');

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
        ]);

        $filename = sprintf(
            'invoice-%s.pdf',
            str_replace(['/', '\\', ' '], '-', $invoice->invoice_number ?? $invoice->id)
        );

        return $pdf->download($filename);
    }

    protected function resolveOrderCheckoutPayload(Request $request, array $validatedInvoice, array $items, float $shippingFee): ?array
    {
        $payload = $request->input('order_checkout');

        if (!is_array($payload) || empty($payload)) {
            return null;
        }

        $billingCountry = $validatedInvoice['bill_to_country'] ?? 'Indonesia';
        if (!$billingCountry) {
            $billingCountry = 'Indonesia';
        }

        $defaults = [
            'customer_type' => 'guest',
            'payment_method' => 'manual_invoice',
            'shipping_fee' => round($shippingFee, 2),
            'source' => 'manual_invoice',
            'is_manual_invoice' => true,
        ];

        $billingDefaults = [
            'receiver_name' => $validatedInvoice['bill_to_name'] ?? null,
            'receiver_phone' => $validatedInvoice['bill_to_phone'] ?? null,
            'receiver_address' => $validatedInvoice['bill_to_address'] ?? null,
            'receiver_postal_code' => $validatedInvoice['bill_to_postal_code'] ?? null,
            'receiver_city' => $validatedInvoice['bill_to_city'] ?? null,
            'receiver_city_code' => $validatedInvoice['bill_to_city_code'] ?? null,
            'receiver_province' => $validatedInvoice['bill_to_province'] ?? null,
            'receiver_province_code' => $validatedInvoice['bill_to_province_code'] ?? null,
            'receiver_district' => $validatedInvoice['bill_to_district'] ?? null,
            'receiver_district_code' => $validatedInvoice['bill_to_district_code'] ?? null,
            'receiver_village' => $validatedInvoice['bill_to_village'] ?? null,
            'receiver_village_code' => $validatedInvoice['bill_to_village_code'] ?? null,
            'receiver_country' => $billingCountry,
            'receiver_country_code' => $validatedInvoice['bill_to_country_code'] ?? null,
            'email' => $validatedInvoice['bill_to_email'] ?? null,
            'contact_name' => $validatedInvoice['bill_to_name'] ?? null,
            'contact_phone' => $validatedInvoice['bill_to_phone'] ?? null,
            'address' => $validatedInvoice['bill_to_address'] ?? null,
            'city' => $validatedInvoice['bill_to_city'] ?? null,
            'city_code' => $validatedInvoice['bill_to_city_code'] ?? null,
            'province' => $validatedInvoice['bill_to_province'] ?? null,
            'province_code' => $validatedInvoice['bill_to_province_code'] ?? null,
            'district' => $validatedInvoice['bill_to_district'] ?? null,
            'district_code' => $validatedInvoice['bill_to_district_code'] ?? null,
            'village' => $validatedInvoice['bill_to_village'] ?? null,
            'village_code' => $validatedInvoice['bill_to_village_code'] ?? null,
            'country' => $billingCountry,
            'country_code' => $validatedInvoice['bill_to_country_code'] ?? null,
            'postal_code' => $validatedInvoice['bill_to_postal_code'] ?? null,
        ];

        $normalized = array_merge($defaults, $payload);

        foreach ($billingDefaults as $key => $value) {
            if (!array_key_exists($key, $normalized) || $normalized[$key] === null || $normalized[$key] === '') {
                $normalized[$key] = $value;
            }
        }

        $normalized['shipping_fee'] = round((float) ($normalized['shipping_fee'] ?? $shippingFee), 2);

        $normalized['latitude'] = isset($normalized['latitude']) && $normalized['latitude'] !== ''
            ? (float) $normalized['latitude']
            : 0.0;
        $normalized['longitude'] = isset($normalized['longitude']) && $normalized['longitude'] !== ''
            ? (float) $normalized['longitude']
            : 0.0;

        $normalized['items'] = array_map(function (array $item): array {
            return [
                'product_id' => $item['product_id'] ?? null,
                'product_name' => $item['product_name'] ?? null,
                'product_description' => $item['product_description'] ?? null,
                'product_image' => $item['product_image'] ?? null,
                'category_id' => $item['category_id'] ?? null,
                'category_name' => $item['category_name'] ?? null,
                'category_description' => $item['category_description'] ?? null,
                'sub_category_id' => $item['sub_category_id'] ?? null,
                'sub_category_name' => $item['sub_category_name'] ?? null,
                'sub_category_description' => $item['sub_category_description'] ?? null,
                'division_id' => $item['division_id'] ?? null,
                'division_name' => $item['division_name'] ?? null,
                'division_description' => $item['division_description'] ?? null,
                'variant_id' => $item['variant_id'] ?? null,
                'variant_name' => $item['variant_name'] ?? null,
                'variant_description' => $item['variant_description'] ?? null,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ];
        }, $items);

        return $normalized;
    }

    protected function dispatchOrderCheckout(array $payload, Request $request): array
    {
        /** @var V1OrderController $orderController */
        $orderController = app(V1OrderController::class);

        $orderRequest = Request::create('/v1/checkout/order', 'POST', $payload);
        $orderRequest->headers->set('Accept', 'application/json');

        if ($request->user()) {
            $orderRequest->setUserResolver(fn () => $request->user());
        }

        try {
            $response = $orderController->checkout($orderRequest);
        } catch (ValidationException $validationException) {
            throw $validationException;
        }

        if ($response instanceof JsonResponse) {
            $status = $response->getStatusCode();
            $data = $response->getData(true);

            if ($status >= 400) {
                $message = $data['message'] ?? 'Failed to create order from invoice.';
                throw ValidationException::withMessages([
                    'order_checkout' => is_string($message) ? $message : 'Failed to create order from invoice.',
                ]);
            }

            return $data;
        }

        if (is_array($response)) {
            return $response;
        }

        throw ValidationException::withMessages([
            'order_checkout' => 'Unable to create order from invoice. Unexpected response received.',
        ]);
    }

    protected function validateInvoice(Request $request, ?Invoice $invoice = null): array
    {
        $isUpdate = $invoice !== null;

        $rules = [
            'invoice_number' => [
                'nullable',
                'string',
                'max:191',
                Rule::unique('invoices', 'invoice_number')->ignore($invoice?->id),
            ],
            'status'           => 'nullable|in:draft,issued,void',
            'issued_at'        => 'nullable|date',
            'due_at'           => 'nullable|date|after_or_equal:issued_at',
            'discount_total'   => 'nullable|numeric|min:0',
            'tax_total'        => 'nullable|numeric|min:0',
            'shipping_total'   => 'nullable|numeric|min:0',
            'bill_to_name'     => $isUpdate ? 'sometimes|required|string|max:191' : 'required|string|max:191',
            'bill_to_email'    => 'nullable|email|max:191',
            'bill_to_phone'    => 'nullable|string|max:191',
            'bill_to_address'  => 'nullable|string',
            'bill_to_city'     => 'nullable|string|max:191',
            'bill_to_city_code' => 'nullable|string|max:191',
            'bill_to_province' => 'nullable|string|max:191',
            'bill_to_province_code' => 'nullable|string|max:191',
            'bill_to_district' => 'nullable|string|max:191',
            'bill_to_district_code' => 'nullable|string|max:191',
            'bill_to_village' => 'nullable|string|max:191',
            'bill_to_village_code' => 'nullable|string|max:191',
            'bill_to_postal_code' => 'nullable|string|max:20',
            'bill_to_country'  => 'nullable|string|max:191',
            'bill_to_country_code' => 'nullable|string|max:10',
            'biteship_destination_id' => 'nullable|string|max:191',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'items'            => [$isUpdate ? 'sometimes' : 'required', 'array', 'min:1'],
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.category_id' => 'nullable|uuid|exists:category,id',
            'items.*.sub_category_id' => 'nullable|uuid|exists:sub_category,id',
            'items.*.division_id' => 'nullable|uuid|exists:division,id',
            'items.*.variant_id' => 'nullable|uuid|exists:variant,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'nullable|numeric|min:0',
        ];

        $validated = validator($request->all(), $rules)->validate();

        return $validated;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{0: array<int, array<string, mixed>>, 1: float}
     *
     * @throws ValidationException
     */
    protected function prepareItems(array $items): array
    {
        $productIds = collect($items)
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->values();

        /** @var Collection<string, Product> $products */
        $products = Product::with([
            'categories',
            'subcategories',
            'divisions',
            'variants',
            'pictures',
        ])->whereIn('id', $productIds)->get()->keyBy('id');

        $prepared = [];
        $subtotal = 0.0;

        foreach ($items as $index => $item) {
            $productId = $item['product_id'] ?? null;

            /** @var Product|null $product */
            $product = $productId ? $products->get($productId) : null;

            if (!$product) {
                throw ValidationException::withMessages([
                    "items.{$index}.product_id" => 'Selected product is no longer available.',
                ]);
            }

            $quantity = max((int) ($item['quantity'] ?? 1), 1);

            $categoryId = $item['category_id'] ?? null;
            $subCategoryId = $item['sub_category_id'] ?? null;
            $divisionId = $item['division_id'] ?? null;
            $variantId = $item['variant_id'] ?? null;

            $category = $categoryId ? $product->categories->firstWhere('id', $categoryId) : null;
            if ($categoryId && !$category) {
                throw ValidationException::withMessages([
                    "items.{$index}.category_id" => 'Selected category is not associated with the product.',
                ]);
            }

            /** @var SubCategory|null $subCategory */
            $subCategory = $subCategoryId ? $product->subcategories->firstWhere('id', $subCategoryId) : null;
            if ($subCategoryId && !$subCategory) {
                throw ValidationException::withMessages([
                    "items.{$index}.sub_category_id" => 'Selected sub category is not associated with the product.',
                ]);
            }

            if (!$category && $subCategory) {
                $category = $product->categories->firstWhere('id', $subCategory->category_id);
            }

            if ($category && $subCategory && $subCategory->category_id && $subCategory->category_id !== $category->id) {
                throw ValidationException::withMessages([
                    "items.{$index}.sub_category_id" => 'Selected sub category does not belong to the chosen category.',
                ]);
            }

            /** @var Division|null $division */
            $division = $divisionId ? $product->divisions->firstWhere('id', $divisionId) : null;
            if ($divisionId && !$division) {
                throw ValidationException::withMessages([
                    "items.{$index}.division_id" => 'Selected division is not associated with the product.',
                ]);
            }

            if (!$subCategory && $division) {
                $subCategory = $product->subcategories->firstWhere('id', $division->sub_category_id);
            }

            if ($division && $subCategory && $division->sub_category_id && $division->sub_category_id !== $subCategory->id) {
                throw ValidationException::withMessages([
                    "items.{$index}.division_id" => 'Selected division does not belong to the chosen sub category.',
                ]);
            }

            /** @var Variant|null $variant */
            $variant = $variantId ? $product->variants->firstWhere('id', $variantId) : null;
            if ($variantId && !$variant) {
                throw ValidationException::withMessages([
                    "items.{$index}.variant_id" => 'Selected variant is not associated with the product.',
                ]);
            }

            if (!$division && $variant) {
                $division = $product->divisions->firstWhere('id', $variant->division_id);
                if ($division && !$subCategory) {
                    $subCategory = $product->subcategories->firstWhere('id', $division->sub_category_id);
                    if ($subCategory && !$category) {
                        $category = $product->categories->firstWhere('id', $subCategory->category_id);
                    }
                }
            }

            if ($variant && $division && $variant->division_id && $variant->division_id !== $division->id) {
                throw ValidationException::withMessages([
                    "items.{$index}.variant_id" => 'Selected variant does not belong to the chosen division.',
                ]);
            }

            $price = $this->calculateProductItemPrice($product, $subCategory, $division, $variant);
            $lineTotal = round($quantity * $price, 2);
            $subtotal += $lineTotal;

            $picture = $product->pictures->first();
            $pictureUrl = $picture?->picture_url ?? $picture?->url ?? null;

            $prepared[] = [
                'id'                        => (string) Str::uuid(),
                'product_id'                => $product->id,
                'product_name'              => $product->product_name,
                'product_description'       => $product->description,
                'product_image'             => $pictureUrl,
                'category_id'               => $category?->id,
                'category_name'             => $category?->name,
                'category_description'      => $category?->description,
                'sub_category_id'           => $subCategory?->id,
                'sub_category_name'         => $subCategory?->name,
                'sub_category_description'  => $subCategory?->description,
                'division_id'               => $division?->id,
                'division_name'             => $division?->name,
                'division_description'      => $division?->description,
                'variant_id'                => $variant?->id,
                'variant_name'              => $variant?->name,
                'variant_description'       => $variant?->description,
                'quantity'                  => $quantity,
                'price'                     => $price,
                'total'                     => $lineTotal,
            ];
        }

        return [$prepared, round($subtotal, 2)];
    }

    protected function calculateProductItemPrice(
        Product $product,
        ?SubCategory $subCategory = null,
        ?Division $division = null,
        ?Variant $variant = null,
    ): float {
        $basePrice = (float) ($product->product_price ?? 0);
        $productDiscount = (float) ($product->product_discount ?? 0);

        $subCategoryPrice = (float) ($subCategory->price ?? 0);
        $divisionPrice = (float) ($division->price ?? 0);
        $variantPrice = (float) ($variant->price ?? 0);

        $subCategoryDiscount = $subCategory
            ? (float) (
                $subCategory->pivot?->use_subcategory_discount === 1
                    ? ($subCategory->discount ?? 0)
                    : ($subCategory->pivot?->manual_discount ?? 0)
            )
            : 0.0;

        $divisionDiscount = $division
            ? (float) (
                $division->pivot?->use_division_discount === 1
                    ? ($division->discount ?? 0)
                    : ($division->pivot?->manual_discount ?? 0)
            )
            : 0.0;

        $variantDiscount = $variant
            ? (float) (
                $variant->pivot?->use_variant_discount === 1
                    ? ($variant->discount ?? 0)
                    : ($variant->pivot?->manual_discount ?? 0)
            )
            : 0.0;

        if ($productDiscount > 0) {
            $discountedBase = $this->applyPercentageDiscount($basePrice, $productDiscount);
            $extraSubCategory = $this->applyPercentageDiscount($subCategoryPrice, $subCategoryDiscount);
            $extraDivision = $this->applyPercentageDiscount($divisionPrice, $divisionDiscount);
            $extraVariant = $this->applyPercentageDiscount($variantPrice, $variantDiscount);

            return max(0.0, round($discountedBase + $extraSubCategory + $extraDivision + $extraVariant, 2));
        }

        return max(0.0, round($basePrice + $subCategoryPrice + $divisionPrice + $variantPrice, 2));
    }

    protected function applyPercentageDiscount(float $amount, float $percentage): float
    {
        if ($amount <= 0 || $percentage <= 0) {
            return round($amount, 2);
        }

        return round($amount - ($amount * $percentage) / 100, 2);
    }

    protected function resolveInvoiceNumber(?string $candidate = null, ?Invoice $ignore = null): string
    {
        $number = $candidate ?: $this->generateInvoiceNumber();

        while ($this->invoiceNumberExists($number, $ignore)) {
            $number = $this->generateInvoiceNumber();
        }

        return $number;
    }

    protected function invoiceNumberExists(string $number, ?Invoice $ignore = null): bool
    {
        $query = Invoice::where('invoice_number', $number);

        if ($ignore) {
            $query->where('id', '!=', $ignore->id);
        }

        return $query->exists();
    }

    protected function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ymd');
        $random = strtoupper(Str::random(5));

        return "{$prefix}-{$random}";
    }

    protected function calculateGrandTotal(float $subtotal, float $discount, float $tax, float $shipping): float
    {
        $grand = $subtotal - $discount + $tax + $shipping;

        return $grand < 0 ? 0.0 : round($grand, 2);
    }

    protected function toAmount(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        return round((float) $value, 2);
    }
}
