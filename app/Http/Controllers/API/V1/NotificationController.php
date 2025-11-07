<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Product;
use App\Models\SubCategory;
use App\Models\Variant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class NotificationController extends Controller
{
    private const DEFAULT_THRESHOLD = 5;

    public function lowStock(Request $request): JsonResponse
    {
        $threshold = (int) $request->integer('threshold', self::DEFAULT_THRESHOLD);

        $notifications = collect()
            ->merge($this->lowStockProducts($threshold))
            ->merge($this->lowStockSubCategories($threshold))
            ->merge($this->lowStockDivisions($threshold))
            ->merge($this->lowStockVariants($threshold))
            ->values();

        return response()->json([
            'threshold' => $threshold,
            'data' => $notifications,
        ]);
    }

    /**
     * Build low stock notifications for a given model.
     */
    protected function resolveLowStockFor(
        Builder $query,
        string $type,
        string $nameColumn,
        int $threshold
    ): Collection {
        return $query
            ->select(['id', $nameColumn, 'total_stock'])
            ->where(function (Builder $builder) use ($threshold) {
                $builder
                    ->whereNull('total_stock')
                    ->orWhere('total_stock', '<=', $threshold);
            })
            ->orderByRaw('COALESCE(total_stock, 0) asc')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => $type,
                'name' => $item->{$nameColumn},
                'remaining' => (int) ($item->total_stock ?? 0),
                'threshold' => $threshold,
            ]);
    }

    protected function lowStockProducts(int $threshold): Collection
    {
        return $this->resolveLowStockFor(
            Product::query(),
            'product',
            'product_name',
            $threshold
        );
    }

    protected function lowStockSubCategories(int $threshold): Collection
    {
        return $this->resolveLowStockFor(
            SubCategory::query(),
            'subcategory',
            'name',
            $threshold
        );
    }

    protected function lowStockDivisions(int $threshold): Collection
    {
        return $this->resolveLowStockFor(
            Division::query(),
            'division',
            'name',
            $threshold
        );
    }

    protected function lowStockVariants(int $threshold): Collection
    {
        return $this->resolveLowStockFor(
            Variant::query(),
            'variant',
            'name',
            $threshold
        );
    }
}
