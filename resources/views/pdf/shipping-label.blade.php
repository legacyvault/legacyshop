<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Shipping Label</title>
    <style>
        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: 11px;
        }

        .label {
            width: 100%;
            border: 1px solid #000;
            padding: 8px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        .header td {
            vertical-align: middle;
        }

        .logo-left {
            font-size: 16px;
            font-weight: bold;
        }

        .logo-right {
            text-align: right;
            font-size: 11px;
        }

        .service-name {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
        }

        .resi-box {
            margin-top: 6px;
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
        }

        .barcode-big-container {
            margin-top: 6px;
            border-bottom: 1px dotted #000;
            padding: 10px 0;
            text-align: center;
        }

        .barcode-big {
            width: 100%;
            max-height: 100px;
        }

        .section-title {
            font-size: 11px;
            font-weight: bold;
        }

        .addr-table td {
            border-bottom: 1px solid #000;
            padding: 4px;
            vertical-align: top;
        }

        .addr-label {
            font-weight: bold;
        }

        .addr-name {
            font-weight: bold;
        }

        .city-row td {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-weight: bold;
        }

        .cashless-row td {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px;
            font-size: 11px;
        }

        .cashless-label {
            width: 30%;
            font-weight: bold;
            text-align: center;
        }

        .info-table td {
            padding: 3px 0;
            font-size: 11px;
        }

        .info-label {
            font-weight: bold;
        }

        .barcode-small {
            max-height: 60px;
        }

        .items-header th,
        .items-body td {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 3px 4px;
            font-size: 10px;
        }

        .items-header th {
            text-align: left;
            font-weight: bold;
        }

        .items-body td {
            vertical-align: top;
        }
    </style>
</head>
<body>
@php
    $itemsCollection = $items instanceof \Illuminate\Support\Collection ? $items : collect($items);

    $formatCurrency = function ($value) {
        $numeric = is_numeric($value) ? (float) $value : 0;
        return 'Rp ' . number_format($numeric, 0, ',', '.');
    };

    $orderCode = $order->order_number ?? '-';
    $courierName = \Illuminate\Support\Str::upper($shipment->courier_name ?? 'Courier');
    $courierService = $shipment->courier_service ?? $shipment->courier_service_name ?? '-';
    $customerPhone = optional(optional($customer)->profile)->phone ?? ($customer->contact_phone ?? null);
    $receiverName = $shipment->receiver_name ?? ($customer->name ?? $customer->contact_name ?? 'Customer');
    $receiverPhone = $shipment->receiver_phone ?? $customerPhone ?? '-';
    $receiverAddressParts = array_filter([
        $shipment->receiver_address,
        $shipment->receiver_city,
        $shipment->receiver_province,
        $shipment->receiver_postal_code,
    ]);
    $receiverAddress = implode(', ', $receiverAddressParts) ?: '—';
    $receiverCity = $shipment->receiver_city ?? '—';
    $receiverDistrict = $shipment->receiver_province ?? '—';

    $senderName = 'LegacyVault';
    $senderAddress = 'Jakarta, Indonesia';

    $shippingFeeDisplay = $formatCurrency($shippingFeeValue ?? ($order->shipping_fee ?? 0));
    $weightDisplay = isset($totalWeight) && $totalWeight > 0 ? number_format($totalWeight, 0) : '—';
@endphp

<div class="label">

    {{-- HEADER --}}
    <table class="header">
        <tr>
            <td style="width: 25%;">
                {{-- Courier Name --}}
                <div class="logo-left">{{ $courierName }}<br/>{{ $courierService }}</div>
            </td>
            <td style="width: 50%;">
                {{-- Company --}}
                <div class="service-name">
                    @if (!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" alt="Company Logo" style="max-height:40px; margin-bottom:4px;">
                    @endif
                </div>
            </td>
            <td style="width: 25%;"></td>
        </tr>
        </tr>
        <tr>
            <td style="width: 25%;">
                {{-- Courier Name --}}
                <div class="logo-left"></div>
            </td>
            <td style="width: 50%;">
                {{-- Company --}}
                <div class="service-name">
                    {{ $senderName }}
                </div>
            </td>
            <td style="width: 25%;"></td>
        </tr>
    </table>

    {{-- AWB NUMBER --}}
    <div class="resi-box">
        No. Resi: {{ $awbNumber ?? '—' }}
    </div>

    {{-- BIG BARCODE --}}
    <div class="barcode-big-container">
        @if (!empty($awbBarcode))
            <img src="data:image/png;base64,{{ $awbBarcode }}" alt="AWB Barcode" class="barcode-big">
        @else
            <div style="font-size:10px; color:#666;">Barcode not available</div>
        @endif
    </div>

    {{-- PENERIMA / PENGIRIM --}}
    <table class="addr-table">
        <tr>
            <td style="width: 50%">
                <span class="addr-label">Penerima:</span>
                <span class="addr-name">{{ $receiverName }}</span>
            </td>
            <td style="width: 50%">
                <span class="addr-label">Pengirim:</span>
                <span class="addr-name">{{ $senderName }}</span>
            </td>
        </tr>
        <tr>
            <td>
                {{ $receiverAddress }}<br>
                <small>Telp: {{ $receiverPhone }}</small>
            </td>
            <td>
                {{ $senderAddress }}
            </td>
        </tr>
    </table>

    {{-- KOTA KIRIM / KECAMATAN --}}
    <table class="city-row">
        <tr>
            <td style="width: 50%">{{ $receiverCity }}</td>
            <td style="width: 50%">{{ $receiverDistrict }}</td>
        </tr>
    </table>

    {{-- CASHLESS --}}
    <table class="cashless-row">
        <tr>
            <td class="cashless-label">Shipping Fee</td>
            <td>{{ $shippingFeeDisplay }}</td>
        </tr>
    </table>

    {{-- BERAT / NO PESANAN --}}
    <table class="info-table">
        <tr>
            <td style="width: 50%">
                <span class="info-label">Berat:</span> {{ $weightDisplay }} gr
            </td>
        </tr>
        <tr>
            <td>
                <span class="info-label">No. Pesanan:</span> {{ $orderCode }}
            </td>
        </tr>
    </table>

    {{-- TABEL ITEM --}}
    <table style="margin-top:4px;">
        <thead class="items-header">
        <tr>
            <th style="width:5%;">#</th>
            <th style="width:45%;">Nama Produk</th>
            <th style="width:20%;">SKU</th>
            <th style="width:10%;">Qty</th>
        </tr>
        </thead>
        <tbody class="items-body">
        @forelse ($itemsCollection as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    <div>
                        {{ $item->product_name ?? '-' }}
                        @if (!empty($item->category_name))
                            <small>, {{ $item->category_name }}</small>
                        @endif
                        @if (!empty($item->sub_category_name))
                            <small>, {{ $item->sub_category_name }}</small>
                        @endif
                        @if (!empty($item->division_name))
                            <small>, {{ $item->division_name }}</small>
                        @endif
                        @if (!empty($item->variant_name))
                            <small>, {{ $item->variant_name }}</small>
                        @endif
                    </div>
                </td>
                <td>{{ optional($item->product)->product_sku ?? '-' }}</td>
                <td>{{ $item->quantity ?? 0 }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4" style="text-align:center;">Tidak ada produk</td>
            </tr>
        @endforelse
        <tr>
            <td colspan="4" style="border-top:none;">
                Pesan: ({{ $orderCode }})
            </td>
        </tr>
        </tbody>
    </table>

</div>
</body>
</html>
