<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItems;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;

class SummaryController extends Controller
{
    /**
     * Render the dashboard view with aggregated sales data.
     */
    public function dashboard()
    {
        $summary = $this->buildSalesSummary();

        return Inertia::render('dashboard', [
            'summary' => $summary,
        ]);
    }

    /**
     * Build headline KPI metrics and sales trend data.
     */
    protected function buildSalesSummary(): array
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $trendStart = $now->copy()->subDays(6)->startOfDay();
        $trendEnd = $now->copy()->endOfDay();
        $previousTrendStart = $trendStart->copy()->subDays(7);
        $previousTrendEnd = $trendStart->copy()->subSecond();

        $paidOrders = $this->paidOrdersQuery();

        $totalRevenue = (float) (clone $paidOrders)->sum('grand_total');
        $paidOrdersCount = (clone $paidOrders)->count();

        $todayRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->sum('grand_total');

        $todayOrders = (clone $paidOrders)
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->count();

        $currentPeriodRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$trendStart, $trendEnd])
            ->sum('grand_total');

        $previousPeriodRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$previousTrendStart, $previousTrendEnd])
            ->sum('grand_total');

        $revenueGrowth = $previousPeriodRevenue > 0
            ? (($currentPeriodRevenue - $previousPeriodRevenue) / $previousPeriodRevenue) * 100
            : null;

        $trend = $this->buildSalesTrend($trendStart, $trendEnd);
        $productHierarchy = $this->buildProductHierarchySummary();

        return [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => Order::count(),
                'averageOrderValue' => $paidOrdersCount > 0 ? $totalRevenue / $paidOrdersCount : 0,
                'todayRevenue' => $todayRevenue,
                'todayOrders' => $todayOrders,
                'revenueGrowthPercentage' => $revenueGrowth,
            ],
            'trend' => $trend,
            'productHierarchy' => $productHierarchy,
        ];
    }

    /**
     * Build daily revenue totals for the provided period.
     */
    protected function buildSalesTrend(Carbon $startDate, Carbon $endDate): array
    {
        /** @var Collection<string, float> $raw */
        $raw = $this->paidOrdersQuery()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as day, SUM(grand_total) as total')
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day')
            ->map(fn ($value) => (float) $value);

        $labels = [];
        $totals = [];

        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $dayKey = $cursor->format('Y-m-d');
            $labels[] = $cursor->translatedFormat('d M');
            $totals[] = $raw->get($dayKey, 0.0);
            $cursor->addDay();
        }

        return [
            'labels' => $labels,
            'totals' => $totals,
        ];
    }

    /**
     * Build aggregated hierarchy-level order tracking data.
     */
    protected function buildProductHierarchySummary(): array
    {
        $rangeStart = Carbon::now()->subDays(29)->startOfDay();
        $rangeEnd = Carbon::now()->endOfDay();

        $items = OrderItems::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('unit', 'unit.id', '=', 'products.unit_id')
            ->where('orders.payment_status', 'payment_received')
            ->whereBetween('orders.created_at', [$rangeStart, $rangeEnd])
            ->selectRaw('
                order_items.product_id,
                order_items.product_name,
                order_items.category_id,
                order_items.category_name,
                order_items.sub_category_id,
                order_items.sub_category_name,
                order_items.division_id,
                order_items.division_name,
                order_items.variant_id,
                order_items.variant_name,
                unit.name as unit_name,
                SUM(order_items.quantity) as total_quantity,
                SUM(order_items.total) as total_revenue
            ')
            ->groupBy(
                'order_items.product_id',
                'order_items.product_name',
                'order_items.category_id',
                'order_items.category_name',
                'order_items.sub_category_id',
                'order_items.sub_category_name',
                'order_items.division_id',
                'order_items.division_name',
                'order_items.variant_id',
                'order_items.variant_name',
                'unit.name'
            )
            ->orderByDesc('total_quantity')
            ->limit(15)
            ->get();

        return $items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'product_name' => $item->product_name,
            'unit_name' => $item->unit_name,
            'category_id' => $item->category_id,
            'category_name' => $item->category_name,
            'sub_category_id' => $item->sub_category_id,
            'sub_category_name' => $item->sub_category_name,
            'division_id' => $item->division_id,
            'division_name' => $item->division_name,
            'variant_id' => $item->variant_id,
            'variant_name' => $item->variant_name,
            'total_quantity' => (int) $item->total_quantity,
            'total_revenue' => (float) $item->total_revenue,
        ])->all();
    }

    /**
     * Limit queries to orders that have completed their payment.
     */
    protected function paidOrdersQuery(): Builder
    {
        return Order::query()->where('payment_status', 'payment_received');
    }
}
