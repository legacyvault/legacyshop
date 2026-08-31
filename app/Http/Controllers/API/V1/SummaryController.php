<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItems;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SummaryController extends Controller
{
    private const INDONESIA_METHODS = ['snap', 'manual_local'];
    private const INTERNATIONAL_METHODS = ['paypal', 'manual_international'];

    /** Presets accepted by the sales-trend range filter. */
    private const RANGE_PRESETS = ['today', '7d', '30d', 'lifetime', 'custom'];

    /** A custom range may not reach further back than this many days before today. */
    private const CUSTOM_RANGE_MAX_DAYS = 30;

    /**
     * Render the dashboard view with aggregated sales data.
     *
     * Accepts a `range` preset (today | 7d | 30d | lifetime | custom) for the
     * sales trend chart. With `range=custom`, `start_date` / `end_date` (Y-m-d)
     * drive the window — clamped to the last 30 days. Defaults to the last 7 days.
     */
    public function dashboard(Request $request)
    {
        $validated = $request->validate([
            'range'      => 'nullable|in:' . implode(',', self::RANGE_PRESETS),
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $summary = $this->buildSalesSummary(
            $validated['range'] ?? null,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null,
        );

        return Inertia::render('dashboard', [
            'summary' => $summary,
        ]);
    }

    /**
     * Build segmented KPI metrics and sales trend data.
     *
     * @param string|null $range     One of self::RANGE_PRESETS. Defaults to '7d'.
     * @param string|null $startDate Y-m-d, inclusive. Only used when $range is 'custom'.
     * @param string|null $endDate   Y-m-d, inclusive. Only used when $range is 'custom'.
     */
    protected function buildSalesSummary(?string $range = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        // A bare start/end without an explicit preset still means "custom".
        $range = $range ?: (($startDate || $endDate) ? 'custom' : '7d');

        [$trendStart, $trendEnd] = $this->resolveTrendRange($range, $startDate, $endDate, $now);
        $granularity = $this->resolveGranularity($trendStart, $trendEnd);

        $indonesia = $this->buildSegmentData(self::INDONESIA_METHODS, $trendStart, $trendEnd, $today, $granularity);
        $international = $this->buildSegmentData(self::INTERNATIONAL_METHODS, $trendStart, $trendEnd, $today, $granularity);

        $usdToIdr = $this->getUsdToIdrRate();

        $all = $usdToIdr !== null
            ? $this->buildAllSegment($usdToIdr, $trendStart, $trendEnd, $today, $granularity)
            : null;

        return [
            'indonesia' => $indonesia,
            'international' => $international,
            'all' => $all,
            'exchangeRateAvailable' => $usdToIdr !== null,
            'exchangeRate' => $usdToIdr,
            'range' => [
                'preset' => $range,
                'start' => $trendStart->format('Y-m-d'),
                'end' => $trendEnd->format('Y-m-d'),
                'granularity' => $granularity,
                'minDate' => $now->copy()->subDays(self::CUSTOM_RANGE_MAX_DAYS - 1)->format('Y-m-d'),
                'maxDate' => $now->format('Y-m-d'),
            ],
        ];
    }

    /**
     * Turn a preset (plus optional custom dates) into an inclusive [start, end] window.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function resolveTrendRange(string $range, ?string $startDate, ?string $endDate, Carbon $now): array
    {
        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy()->endOfDay();

        return match ($range) {
            'today' => [$todayStart, $todayEnd],
            '30d' => [$todayEnd->copy()->subDays(29)->startOfDay(), $todayEnd],
            'lifetime' => [$this->earliestPaidOrderDate() ?? $todayStart, $todayEnd],
            'custom' => $this->resolveCustomRange($startDate, $endDate, $now),
            default => [$todayEnd->copy()->subDays(6)->startOfDay(), $todayEnd],
        };
    }

    /**
     * Clamp a custom range to the last self::CUSTOM_RANGE_MAX_DAYS days (today inclusive).
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function resolveCustomRange(?string $startDate, ?string $endDate, Carbon $now): array
    {
        $floor = $now->copy()->subDays(self::CUSTOM_RANGE_MAX_DAYS - 1)->startOfDay();
        $ceiling = $now->copy()->endOfDay();

        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : $ceiling;
        $end = $end->greaterThan($ceiling) ? $ceiling : $end;
        $end = $end->lessThan($floor) ? $floor->copy()->endOfDay() : $end;

        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : $end->copy()->subDays(6)->startOfDay();
        $start = $start->lessThan($floor) ? $floor->copy() : $start;
        $start = $start->greaterThan($end) ? $end->copy()->startOfDay() : $start;

        return [$start, $end];
    }

    /**
     * Pick bucket size so the chart stays readable: hourly for a single day,
     * daily up to a quarter, monthly beyond that (e.g. lifetime).
     */
    protected function resolveGranularity(Carbon $start, Carbon $end): string
    {
        $days = $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;

        return match (true) {
            $days <= 1 => 'hour',
            $days <= 92 => 'day',
            default => 'month',
        };
    }

    /**
     * Earliest paid order date across every tracked payment method (null when there are none).
     */
    protected function earliestPaidOrderDate(): ?Carbon
    {
        $earliest = $this->paidOrdersQuery(array_merge(self::INDONESIA_METHODS, self::INTERNATIONAL_METHODS))
            ->min('created_at');

        return $earliest ? Carbon::parse($earliest)->startOfDay() : null;
    }

    /**
     * Build KPIs, trend and product hierarchy for a specific set of payment methods.
     */
    protected function buildSegmentData(array $paymentMethods, Carbon $trendStart, Carbon $trendEnd, Carbon $today, string $granularity = 'day'): array
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

        $trend = $this->buildTrend($paymentMethods, $trendStart, $trendEnd, $granularity);
        $productHierarchy = $this->buildProductHierarchySummary($paymentMethods);

        return [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => Order::where('payment_status', 'payment_received')->whereIn('payment_method', $paymentMethods)->count(),
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
    protected function buildAllSegment(float $usdToIdr, Carbon $trendStart, Carbon $trendEnd, Carbon $today, string $granularity = 'day'): array
    {
        $allMethods = array_merge(self::INDONESIA_METHODS, self::INTERNATIONAL_METHODS);
        $intlMethods = self::INTERNATIONAL_METHODS;

        $baseQuery = fn() => Order::query()
            ->where('payment_status', 'payment_received')
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

        $trend = $this->buildTrend($allMethods, $trendStart, $trendEnd, $granularity, $usdToIdr);
        $productHierarchy = $this->buildProductHierarchySummary($allMethods);

        return [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => Order::where('payment_status', 'payment_received')->whereIn('payment_method', $allMethods)->count(),
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
     * Build a revenue trend for the given period, bucketed by hour, day or month.
     *
     * When $usdToIdr is provided, international orders are converted to IDR so the
     * "All" segment can mix both currencies in a single series.
     */
    protected function buildTrend(array $paymentMethods, Carbon $startDate, Carbon $endDate, string $granularity = 'day', ?float $usdToIdr = null): array
    {
        if ($granularity === 'hour') {
            return $this->buildHourlyTrend($paymentMethods, $startDate, $endDate, $usdToIdr);
        }

        $totalExpr = $usdToIdr !== null
            ? "SUM(CASE WHEN payment_method IN ('" . implode("','", self::INTERNATIONAL_METHODS) . "') THEN grand_total * {$usdToIdr} ELSE grand_total END)"
            : 'SUM(grand_total)';

        $daily = $this->paidOrdersQuery($paymentMethods)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw("DATE(created_at) as day, {$totalExpr} as total")
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day')
            ->map(fn($value) => (float) $value);

        $labels = [];
        $totals = [];

        if ($granularity === 'month') {
            $cursor = $startDate->copy()->startOfMonth();
            $lastMonth = $endDate->copy()->startOfMonth();

            while ($cursor->lte($lastMonth)) {
                $prefix = $cursor->format('Y-m');
                $labels[] = $cursor->translatedFormat('M Y');
                $totals[] = (float) $daily
                    ->filter(fn($value, $day) => str_starts_with((string) $day, $prefix))
                    ->sum();
                $cursor->addMonth();
            }

            return ['labels' => $labels, 'totals' => $totals];
        }

        $cursor = $startDate->copy()->startOfDay();
        while ($cursor->lte($endDate)) {
            $labels[] = $cursor->translatedFormat('d M');
            $totals[] = $daily->get($cursor->format('Y-m-d'), 0.0);
            $cursor->addDay();
        }

        return ['labels' => $labels, 'totals' => $totals];
    }

    /**
     * Hourly buckets for single-day ranges. Bucketed in PHP so the query stays
     * driver-agnostic (no DATE_FORMAT / strftime dialect split).
     */
    protected function buildHourlyTrend(array $paymentMethods, Carbon $startDate, Carbon $endDate, ?float $usdToIdr = null): array
    {
        $orders = $this->paidOrdersQuery($paymentMethods)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get(['created_at', 'grand_total', 'payment_method']);

        $buckets = array_fill(0, 24, 0.0);

        foreach ($orders as $order) {
            $amount = (float) $order->grand_total;

            if ($usdToIdr !== null && in_array($order->payment_method, self::INTERNATIONAL_METHODS, true)) {
                $amount *= $usdToIdr;
            }

            $buckets[(int) Carbon::parse($order->created_at)->format('G')] += $amount;
        }

        $labels = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $labels[] = sprintf('%02d:00', $hour);
        }

        return [
            'labels' => $labels,
            'totals' => array_values($buckets),
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
            ->where('orders.payment_status', 'payment_received')
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
        $query = Order::query()->where('payment_status', 'payment_received');
        if (!empty($paymentMethods)) {
            $query->whereIn('payment_method', $paymentMethods);
        }
        return $query;
    }
}
