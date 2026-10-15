<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $comprobante->cod_comprobante }}</title>
    <style>
        /* Formato optimizado para Impresora Térmica LN-POS80-CX (Papel continuo 80mm) */
        @page {
            margin: 6px 3mm 6px 3mm;
            size: 80mm auto;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.25;
            color: #000;
            margin: 0;
            padding: 0 2px;
            width: 100%;
            max-width: 74mm;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #333;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 4px;
        }
        .logo-img {
            width: 130px;
            max-width: 145px;
            height: auto;
            margin: 0 auto 3px auto;
            display: block;
        }
        .logo-title {
            font-size: 13.5px;
            font-weight: 800;
            margin: 2px 0 1px 0;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }
        .ruc-header {
            font-size: 10.5px;
            font-weight: bold;
            margin: 2px 0;
            color: #111;
        }
        .subtitle {
            font-size: 8.5px;
            color: #333;
            margin: 1px 0;
            word-wrap: break-word;
        }
        .ticket-code-box {
            font-size: 11.5px;
            font-weight: 800;
            margin-top: 5px;
            padding: 4px 2px;
            border-top: 1px dotted #888;
            border-bottom: 1px dotted #888;
            text-transform: uppercase;
        }
        .info-section {
            margin-bottom: 6px;
            font-size: 9.5px;
        }
        .info-row {
            margin: 2px 0;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 78px;
            color: #222;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 6px;
            table-layout: fixed;
        }
        .items-table th {
            border-top: 1px dashed #333;
            border-bottom: 1px dashed #333;
            padding: 4px 0;
            font-size: 9px;
            font-weight: bold;
            text-align: left;
        }
        .items-table td {
            padding: 3px 0;
            vertical-align: top;
            font-size: 9.5px;
            word-wrap: break-word;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .col-cant {
            width: 18%;
        }
        .col-desc {
            width: 52%;
        }
        .col-total {
            width: 30%;
            padding-right: 2px;
        }
        .totals-table {
            width: 100%;
            border-top: 1px dashed #333;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 8px;
            padding-top: 4px;
        }
        .totals-table td {
            padding: 2px 0;
        }
        .totals-table .total-highlight {
            font-size: 11.5px;
            font-weight: 800;
            border-top: 1px dotted #aaa;
            padding-top: 3px;
        }
        .badge {
            display: inline-block;
            padding: 1px 5px;
            font-weight: bold;
            font-size: 8.5px;
            border-radius: 2px;
            text-transform: uppercase;
        }
        .badge-debe { background-color: #fee2e2; color: #991b1b; }
        .badge-abono { background-color: #fef3c7; color: #92400e; }
        .badge-cancelado { background-color: #d1fae5; color: #065f46; }

        /* Contenedor Código QR SUNAT */
        .qr-section {
            border-top: 1px dashed #444;
            padding-top: 8px;
            padding-bottom: 6px;
            text-align: center;
            margin-bottom: 6px;
        }
        .qr-img {
            width: 95px;
            height: 95px;
            margin: 0 auto 4px auto;
            display: block;
        }
        .sunat-caption {
            font-size: 7.5px;
            color: #222;
            line-height: 1.25;
            margin-top: 3px;
        }
        .hash-code {
            font-family: 'Courier', monospace;
            font-size: 6.8px;
            color: #444;
            display: block;
            margin-top: 2px;
            word-break: break-all;
        }
        .footer {
            border-top: 1px dashed #333;
            padding-top: 6px;
            text-align: center;
            font-size: 7.8px;
            color: #333;
            line-height: 1.25;
        }
        .footer p {
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoBase64))
            <div class="logo-container">
                <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo" />
            </div>
        @endif
        <h1 class="logo-title">LAVANDERIA SEPRIET</h1>
        <div class="ruc-header">R.U.C. {{ $empresaRuc }}</div>
        <div class="subtitle">{{ $local->nombre ?? 'Oficina Principal' }}</div>
        <div class="subtitle">{{ $local->direccion ?? 'Av. Agustín de la Rosa Toro 318, San Luis' }}</div>
        <div class="subtitle">Tel: {{ $local->telefono ?? '913 027 176' }}</div>
        <div class="ticket-code-box">
            {{ $tipoComprobanteNombre }}<br>
            {{ $comprobante->cod_comprobante }}
        </div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">CLIENTE:</span>
            <span><strong>{{ strtoupper($comprobante->cliente->nombres ?? 'CLIENTES VARIOS') }}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">DNI / RUC:</span>
            <span>{{ $comprobante->cliente->dni ?? ($comprobante->num_ruc ?? 'N/A') }}</span>
        </div>
        @if(!empty($comprobante->razon_social))
        <div class="info-row">
            <span class="info-label">R. SOCIAL:</span>
            <span>{{ strtoupper($comprobante->razon_social) }}</span>
        </div>
        @endif
        @if(!empty($comprobante->cliente->telefono))
        <div class="info-row">
            <span class="info-label">TELÉFONO:</span>
            <span>{{ $comprobante->cliente->telefono }}</span>
        </div>
        @endif
        <div class="info-row">
            <span class="info-label">FECHA:</span>
            <span>{{ \Carbon\Carbon::parse($comprobante->fecha)->format('d/m/Y h:i A') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">COND. PAGO:</span>
            <span><strong>{{ strtoupper($comprobante->metodoPago->nom_metodo_pago ?? 'EFECTIVO') }}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">ESTADO PAGO:</span>
            <span class="badge {{ $badgeClass }}">
                {{ strtoupper($comprobante->estadoComprobante->nom_estado ?? 'DEBE') }}
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">EST. PRENDA:</span>
            <span><strong>{{ strtoupper($comprobante->estadoRopa->nom_estado_ropa ?? 'RECIBIDO') }}</strong></span>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th class="col-cant">CANT/KG</th>
                <th class="col-desc">SERVICIO</th>
                <th class="col-total text-right">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($comprobante->detalles as $detalle)
            <tr>
                <td class="col-cant">{{ number_format($detalle->peso_kg, 2) }}</td>
                <td class="col-desc">
                    {{ strtoupper($detalle->servicio->nom_servicio ?? 'SERVICIO') }}
                    @if(!empty($detalle->observaciones))
                        <br><small style="color: #555;">({{ $detalle->observaciones }})</small>
                    @endif
                </td>
                <td class="col-total text-right">S/ {{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        @if($comprobante->tipo_comprobante === 'F' || $comprobante->tipo_comprobante === 'B')
        <tr>
            <td style="text-align: left;">OP. GRAVADAS:</td>
            <td class="text-right" style="padding-right: 2px;">S/ {{ number_format($opGravadas, 2) }}</td>
        </tr>
        <tr>
            <td style="text-align: left;">I.G.V. (18%):</td>
            <td class="text-right" style="padding-right: 2px;">S/ {{ number_format($igv, 2) }}</td>
        </tr>
        @endif
        @if((float)($comprobante->descuento ?? 0) > 0)
        <tr>
            <td style="text-align: left;">DESCUENTO:</td>
            <td class="text-right" style="padding-right: 2px;">- S/ {{ number_format($comprobante->descuento, 2) }}</td>
        </tr>
        @endif
        <tr class="total-highlight">
            <td style="text-align: left;">TOTAL A PAGAR:</td>
            <td class="text-right" style="padding-right: 2px;">S/ {{ number_format($comprobante->costo_total, 2) }}</td>
        </tr>
        <tr>
            <td style="text-align: left;">MONTO ABONADO:</td>
            <td class="text-right" style="padding-right: 2px;">S/ {{ number_format($comprobante->monto_abonado, 2) }}</td>
        </tr>
        <tr>
            <td style="text-align: left; font-weight: bold;">SALDO PENDIENTE:</td>
            <td class="text-right" style="padding-right: 2px; font-weight: bold; color: {{ $comprobante->monto_restante > 0 ? '#b91c1c' : '#047857' }};">
                S/ {{ number_format($comprobante->monto_restante, 2) }}
            </td>
        </tr>
    </table>

    @if(!empty($qrBase64))
    <div class="qr-section">
        <img src="{{ $qrBase64 }}" class="qr-img" alt="QR SUNAT" />
        <div class="sunat-caption">
            <strong>Representación impresa de la {{ $tipoComprobanteNombreSunat }}</strong><br>
            Consulte su comprobante en: <strong>https://app.sepriet.com</strong>
            @if(!empty($codigoHash))
                <span class="hash-code">Resumen: {{ $codigoHash }}</span>
            @endif
        </div>
    </div>
    @endif

    <div class="footer">
        <p>• Conserve este ticket para retirar sus prendas.</p>
        <p>• Plazo máximo de retiro: 30 días calendario.</p>
        <p>• Pasados los 30 días, la empresa no se responsabiliza por prendas no reclamadas.</p>
        <p>• No se aceptan reclamos una vez retirada la prenda.</p>
        <p style="margin-top: 5px; font-weight: bold; font-size: 8.5px;">¡Gracias por su preferencia!</p>
    </div>
</body>
</html>
