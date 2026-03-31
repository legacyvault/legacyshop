<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItems;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SummaryController extends Controller
{
    private const INDONESIA_METHODS = ['snap', 'manual_local'];
    private const INTERNATIONAL_METHODS = ['paypal', 'manual_international'];

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
     * Build segmented KPI metrics and sales trend data.
     */
    protected function buildSalesSummary(): array
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $trendStart = $now->copy()->subDays(6)->startOfDay();
        $trendEnd = $now->copy()->endOfDay();

        $indonesia = $this->buildSegmentData(self::INDONESIA_METHODS, $trendStart, $trendEnd, $today);
        $international = $this->buildSegmentData(self::INTERNATIONAL_METHODS, $trendStart, $trendEnd, $today);

        $usdToIdr = $this->getUsdToIdrRate();

        $all = $usdToIdr !== null
            ? $this->buildAllSegment($usdToIdr, $trendStart, $trendEnd, $today)
            : null;

        return [
            'indonesia' => $indonesia,
            'international' => $international,
            'all' => $all,
            'exchangeRateAvailable' => $usdToIdr !== null,
            'exchangeRate' => $usdToIdr,
        ];
    }

    /**
     * Build KPIs, trend and product hierarchy for a specific set of payment methods.
     */
    protected function buildSegmentData(array $paymentMethods, Carbon $trendStart, Carbon $trendEnd, Carbon $today): array
    {
        $paidOrders = $this->paidOrdersQuery($paymentMethods);

        $totalRevenue = (float) (clone $paidOrders)->sum('grand_total');
        $paidOrdersCount = (clone $paidOrders)->count();

        $todayRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->sum('grand_total');

        $todayOrders = (clone $paidOrders)
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->count();

        $previousTrendStart = $trendStart->copy()->subDays(7);
        $previousTrendEnd = $trendStart->copy()->subSecond();

        $currentPeriodRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$trendStart, $trendEnd])
            ->sum('grand_total');

        $previousPeriodRevenue = (float) (clone $paidOrders)
            ->whereBetween('created_at', [$previousTrendStart, $previousTrendEnd])
            ->sum('grand_total');

        $revenueGrowth = $previousPeriodRevenue > 0
            ? (($currentPeriodRevenue - $previousPeriodRevenue) / $previousPeriodRevenue) * 100
            : null;

        $trend = $this->buildSalesTrend($trendStart, $trendEnd, $paymentMethods);
        $productHierarchy = $this->buildProductHierarchySummary($paymentMethods);

        return [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => Order::where('status', 'order_confirmed')->whereIn('payment_method', $paymentMethods)->count(),
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
     * Build the combined "All" segment with international amounts converted to IDR.
     */
    protected function buildAllSegment(float $usdToIdr, Carbon $trendStart, Carbon $trendEnd, Carbon $today): array
    {
        $allMethods = array_merge(self::INDONESIA_METHODS, self::INTERNATIONAL_METHODS);
        $intlMethods = self::INTERNATIONAL_METHODS;

        $baseQuery = fn() => Order::query()
            ->where('status', 'order_confirmed')
            ->whereIn('payment_method', $allMethods);

        $revenueExpr = "SUM(CASE WHEN payment_method IN ('" . implode("','", $intlMethods) . "') THEN grand_total * {$usdToIdr} ELSE grand_total END)";

        $totalRevenue = (float) (clone $baseQuery())
            ->selectRaw("{$revenueExpr} as converted_total")
            ->value('converted_total');

        $paidOrdersCount = (clone $baseQuery())->count();

        $todayRevenue = (float) (clone $baseQuery())
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->selectRaw("{$revenueExpr} as converted_total")
            ->value('converted_total');

        $todayOrders = (clone $baseQuery())
            ->whereBetween('created_at', [$today, $today->copy()->endOfDay()])
            ->count();

        $previousTrendStart = $trendStart->copy()->subDays(7);
        $previousTrendEnd = $trendStart->copy()->subSecond();

        $currentPeriodRevenue = (float) (clone $baseQuery())
            ->whereBetween('created_at', [$trendStart, $trendEnd])
            ->selectRaw("{$revenueExpr} as converted_total")
            ->value('converted_total');

        $previousPeriodRevenue = (float) (clone $baseQuery())
            ->whereBetween('created_at', [$previousTrendStart, $previousTrendEnd])
            ->selectRaw("{$revenueExpr} as converted_total")
            ->value('converted_total');

        $revenueGrowth = $previousPeriodRevenue > 0
            ? (($currentPeriodRevenue - $previousPeriodRevenue) / $previousPeriodRevenue) * 100
            : null;

        $trend = $this->buildAllSalesTrend($usdToIdr, $trendStart, $trendEnd);
        $productHierarchy = $this->buildProductHierarchySummary($allMethods);

        return [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => Order::where('status', 'order_confirmed')->whereIn('payment_method', $allMethods)->count(),
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
     * Build daily revenue totals for the provided period (with payment method filter).
     */
    protected function buildSalesTrend(Carbon $startDate, Carbon $endDate, array $paymentMethods = []): array
    {
        $raw = $this->paidOrdersQuery($paymentMethods)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as day, SUM(grand_total) as total')
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day')
            ->map(fn($value) => (float) $value);

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
     * Build daily revenue trend for "All" tab with USD→IDR conversion per row.
     */
    protected function buildAllSalesTrend(float $usdToIdr, Carbon $startDate, Carbon $endDate): array
    {
        $allMethods = array_merge(self::INDONESIA_METHODS, self::INTERNATIONAL_METHODS);
        $intlMethods = self::INTERNATIONAL_METHODS;

        $revenueExpr = "SUM(CASE WHEN payment_method IN ('" . implode("','", $intlMethods) . "') THEN grand_total * {$usdToIdr} ELSE grand_total END)";

        $raw = Order::query()
            ->where('status', 'order_confirmed')
            ->whereIn('payment_method', $allMethods)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw("DATE(created_at) as day, {$revenueExpr} as total")
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day')
            ->map(fn($value) => (float) $value);

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
     * Build aggregated hierarchy-level order tracking data (with optional payment method filter).
     */
    protected function buildProductHierarchySummary(array $paymentMethods = []): array
    {
        $rangeStart = Carbon::now()->subDays(29)->startOfDay();
        $rangeEnd = Carbon::now()->endOfDay();

        $query = OrderItems::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'order_confirmed')
            ->whereBetween('orders.created_at', [$rangeStart, $rangeEnd]);

        if (!empty($paymentMethods)) {
            $query->whereIn('orders.payment_method', $paymentMethods);
        }

        $items = $query->selectRaw('
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
            order_items.price as unit_price,
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
                'order_items.price'
            )
            ->orderByDesc('total_quantity')
            ->limit(15)
            ->get();

        return $items->map(fn($item) => [
            'product_id' => $item->product_id,
            'product_name' => $item->product_name,
            'unit_price' => (float) $item->unit_price,
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
     * Fetch USD→IDR exchange rate, cached for 24 hours.
     * Returns null if the API is unavailable.
     */
    protected function getUsdToIdrRate(): ?float
    {
        return Cache::remember('exchange_rate_usd_idr', 86400, function () {
            try {
                $response = Http::timeout(5)->get('https://open.er-api.com/v6/latest/USD');
                if ($response->successful()) {
                    $rate = $response->json('rates.IDR');
                    return $rate ? (float) $rate : null;
                }
            } catch (\Exception) {
                // Network error or timeout
            }
            return null;
        });
    }

    /**
     * Limit queries to paid orders, optionally filtered by payment method.
     */
    protected function paidOrdersQuery(array $paymentMethods = []): Builder
    {
        $query = Order::query()->where('status', 'order_confirmed');
        if (!empty($paymentMethods)) {
            $query->whereIn('payment_method', $paymentMethods);
        }
        return $query;
    }
}
