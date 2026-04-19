<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Shipped</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

    <!-- BIG TITLE -->
    <h1 style="font-size: 24px; margin-bottom: 20px;">
        It's on its way.
    </h1>

    <!-- ENGLISH -->
    <p>
        We appreciate your support. Your item has been packed and handed off to the carrier — 
        use the link below to follow your package to your door.
    </p>

    <p style="font-style: italic;">
        Beautify-ing your collection.
    </p>

    <br>

    <!-- WAYBILL -->
    <p>
        <strong>Waybill Number:</strong><br>
        {{ $waybill }}
    </p>

    <br>

    <!-- TRACKING (KEEPED YOUR LOGIC) -->
    @if($trackingUrl)
        <p>
            <strong>Track your shipment here:</strong><br>
            <a href="{{ $trackingUrl }}" target="_blank">
                {{ $trackingUrl }}
            </a>
        </p>
    @else
        <p>
            Tracking link is not available yet. Please check again later using your waybill number.
        </p>
    @endif

    <br>

    <!-- INDONESIAN -->
    <p><strong>Bahasa Indonesia</strong></p>

    <p>
        Kami sangat menghargai kepercayaan Anda. Barang Anda telah dikemas dan diserahkan ke kurir — 
        gunakan tautan di bawah untuk melacak paket Anda.
    </p>

    <p style="font-style: italic;">
        Beautify-ing your collection.
    </p>

    <br>

    <!-- CONTACT -->
    <p>
        <strong>Got any questions? / Ada pertanyaan?</strong><br><br>

        📧 legacyvault.business@gmail.com<br>
        📷 @legacyvault.id
    </p>

</body>
</html>