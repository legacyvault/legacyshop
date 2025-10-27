<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #1f2933;
            margin: 0;
            padding: 24px;
        }
        h1, h2, h3, h4 {
            margin: 0;
            font-weight: 600;
        }
        h1 {
            font-size: 22px;
            margin-bottom: 4px;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 24px;
        }
        .meta-table td {
            vertical-align: top;
            width: 50%;
            padding: 4px 0;
        }
        .label {
            font-weight: 600;
            margin-bottom: 4px;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        table.items th,
        table.items td {
            border: 1px solid #d2d6dc;
            padding: 8px;
            text-align: left;
        }
        table.items th {
            background: #f4f5f7;
            font-weight: 600;
        }
        table.items td.text-right {
            text-align: right;
        }
        .totals {
            width: 100%;
        }
        .totals td {
            padding: 4px 0;
        }
        .totals .label {
            text-align: right;
            padding-right: 16px;
        }
        .totals .value {
            width: 160px;
            text-align: right;
        }
        .footer {
            margin-top: 32px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    @php
        $issuedAt = optional($invoice->issued_at)->format('d M Y H:i');
        $dueAt = optional($invoice->due_at)->format('d M Y H:i');
        $formatCurrency = static fn ($value) => 'Rp ' . number_format((float) $value, 2, ',', '.');
    @endphp

    <header style="margin-bottom: 24px;">
        <h1>Invoice</h1>
        <div style="font-size: 13px; color: #4b5563;">
            {{ $invoice->invoice_number }}<br>
            Status: {{ ucfirst($invoice->status) }}
        </div>
    </header>

    <table class="meta-table">
        <tr>
            <td>
                <div class="label">Bill To</div>
                <div>
                    {{ $invoice->bill_to_name }}<br>
                    @if($invoice->bill_to_email)
                        {{ $invoice->bill_to_email }}<br>
                    @endif
                    @if($invoice->bill_to_phone)
                        {{ $invoice->bill_to_phone }}<br>
                    @endif
                    @if($invoice->bill_to_address)
                        {{ $invoice->bill_to_address }}<br>
                    @endif
                    @if($invoice->bill_to_city || $invoice->bill_to_province)
                        {{ $invoice->bill_to_city ? $invoice->bill_to_city . ', ' : '' }}{{ $invoice->bill_to_province }}<br>
                    @endif
                    @if($invoice->bill_to_postal_code)
                        {{ $invoice->bill_to_postal_code }}<br>
                    @endif
                    @if($invoice->bill_to_country)
                        {{ $invoice->bill_to_country }}
                    @endif
                </div>
            </td>
            <td>
                <div class="label">Invoice Details</div>
                <div>
                    Issued: {{ $issuedAt ?? '—' }}<br>
                    Due: {{ $dueAt ?? '—' }}<br>
                    Items: {{ $invoice->items->count() }}<br>
                    Total: {{ $formatCurrency($invoice->grand_total) }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 40%;">Product</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 15%;">Price</th>
                <th style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
            <tr>
                <td>
                    <div style="font-weight: 600;">{{ $item->product_name }}</div>
                    @if($item->category_name)
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                            {{ $item->category_name }}
                        </div>
                    @endif
                    @if($item->sub_category_name)
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                            {{ $item->sub_category_name }}
                        </div>
                    @endif
                    @if($item->division_name)
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                            {{ $item->division_name }}
                        </div>
                    @endif
                    @if($item->variant_name)
                        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                            Variant: {{ $item->variant_name }}
                        </div>
                    @endif
                </td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ $formatCurrency($item->price) }}</td>
                <td class="text-right">{{ $formatCurrency($item->total) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="totals" align="right">
        <tr>
            <td class="label">Subtotal</td>
            <td class="value">{{ $formatCurrency($invoice->subtotal) }}</td>
        </tr>
        <tr>
            <td class="label">Discount</td>
            <td class="value">-{{ $formatCurrency($invoice->discount_total) }}</td>
        </tr>
        <tr>
            <td class="label">Tax</td>
            <td class="value">{{ $formatCurrency($invoice->tax_total) }}</td>
        </tr>
        <tr>
            <td class="label">Shipping</td>
            <td class="value">{{ $formatCurrency($invoice->shipping_total) }}</td>
        </tr>
        <tr>
            <td class="label" style="font-size: 14px; font-weight: 600;">Grand Total</td>
            <td class="value" style="font-size: 14px; font-weight: 600;">{{ $formatCurrency($invoice->grand_total) }}</td>
        </tr>
    </table>

    <div style="clear: both;"></div>

    <div class="footer">
        Generated on {{ now()->format('d M Y H:i') }}.
    </div>
</body>
</html>
