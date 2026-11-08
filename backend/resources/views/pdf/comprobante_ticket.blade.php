<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $comprobante->cod_comprobante }}</title>
    <style>
        @page {
            margin: 1.5mm 1.5mm 1.5mm 1.5mm;
            size: 72mm auto;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 6.8pt;
            line-height: 1.15;
            color: #000;
            width: 100%;
            max-width: 68mm;
            margin: 0 auto;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .divider {
            border-top: 1px dashed #333;
            margin: 3px 0;
            width: 100%;
        }

        /* 1. Header / Empresa */
        .header {
            text-align: center;
            margin-bottom: 2px;
        }
        .logo-img {
            max-width: 95px;
            max-height: 30px;
            margin: 0 auto 1px auto;
            display: block;
        }
        .company-name {
            font-size: 7.8pt;
            font-weight: bold;
            margin-bottom: 1px;
            letter-spacing: 0.2px;
        }
        .company-info {
            font-size: 6.3pt;
            color: #111;
            line-height: 1.15;
            margin-bottom: 0.5px;
        }

        /* 2. Título de Comprobante y Número */
        .doc-section {
            text-align: center;
            margin: 3px 0 3px 0;
        }
        .doc-type {
            font-size: 7.6pt;
            font-weight: bold;
            letter-spacing: 0.2px;
        }
        .doc-number {
            font-size: 7.5pt;
            font-weight: bold;
            margin-top: 1px;
        }

        /* 3. Tabla de Metadatos */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 6.6pt;
            margin-bottom: 1px;
        }
        .info-table td {
            vertical-align: top;
            padding: 0.5px 0;
        }
        .col-label {
            width: 28%;
            white-space: nowrap;
        }
        .col-sep {
            width: 4%;
            text-align: center;
        }
        .col-val {
            width: 68%;
            word-break: break-word;
        }

        /* 4. Sección Cliente */
        .client-header {
            font-size: 6.8pt;
            font-weight: bold;
            margin-top: 3px;
            margin-bottom: 1px;
        }

        /* 5. Tabla de Ítems (Formato Opeluce) */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
            font-size: 6.6pt;
        }
        .items-table thead th {
            padding: 2px 0 1px 0;
            font-weight: bold;
            border-top: 1px dashed #333;
            border-bottom: 1px dashed #333;
            font-size: 6.6pt;
        }
        .th-cant { width: 15%; text-align: left; }
        .th-punit { width: 28%; text-align: center; }
        .th-desc { width: 24%; text-align: center; }
        .th-importe { width: 33%; text-align: right; padding-right: 1px; }

        .item-data-row td {
            padding-top: 2px;
            vertical-align: bottom;
        }
        .item-desc-row td {
            padding-bottom: 2px;
            line-height: 1.15;
            vertical-align: top;
        }
        .td-cant { text-align: left; }
        .td-punit { text-align: center; }
        .td-desc { text-align: center; }
        .td-importe { text-align: right; padding-right: 1px; }
        .item-description {
            font-size: 6.6pt;
            text-transform: uppercase;
        }
        .item-obs {
            font-size: 5.8pt;
            color: #444;
            display: block;
        }

        /* 6. Totales (Alineados estilo Opeluce) */
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 6.6pt;
            margin-top: 2px;
            margin-bottom: 2px;
            border-top: 1px dashed #333;
            padding-top: 2px;
        }
        .totals-table td {
            padding: 0.5px 0;
            vertical-align: middle;
        }
        .tot-lbl {
            width: 60%;
            text-align: left;
        }
        .tot-sep {
            width: 4%;
            text-align: center;
        }
        .tot-val {
            width: 36%;
            text-align: right;
            padding-right: 1px;
        }
        .tot-total-row td {
            font-weight: bold;
            font-size: 7.4pt;
            padding: 1.5px 0;
        }

        /* 7. Monto en letras */
        .letras-box {
            font-size: 6.6pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 3px 0 4px 0;
            line-height: 1.15;
        }

        /* 8. Código QR (Medida Opeluce: ~25mm) */
        .qr-section {
            text-align: center;
            margin: 4px 0 3px 0;
        }
        .qr-img {
            width: 70px;
            height: 70px;
            display: block;
            margin: 0 auto;
        }
        .sunat-caption {
            font-size: 6.0pt;
            line-height: 1.15;
            margin-top: 2px;
            color: #111;
        }
        .resumen-hash {
            font-size: 5.5pt;
            color: #333;
            margin-top: 1px;
            word-break: break-all;
        }

        /* 9. Pie de página y condiciones */
        .footer {
            margin-top: 4px;
            border-top: 1px dashed #333;
            padding-top: 3px;
            font-size: 5.8pt;
            line-height: 1.15;
            color: #222;
        }
        .footer p {
            margin-bottom: 1.5px;
        }
        .gracias {
            text-align: center;
            font-weight: bold;
            font-size: 7.2pt;
            margin-top: 3px;
        }
    </style>
</head>
<body>
    {{-- 1. Logo y Datos de la Empresa --}}
    <div class="header">
        @if(!empty($logoBase64))
            <img src="{{ $logoBase64 }}" alt="Logo Sepriet" class="logo-img" />
        @endif
        <div class="company-name">LAVANDERIA SEPRIET S.A.C.</div>
        <div class="company-info">RUC {{ $empresaRuc }}</div>
        <div class="company-info">{{ strtoupper($local->direccion ?? 'AV. AGUSTIN DE LA ROSA TORO 318 SAN LUIS') }}</div>
        @if(!empty($local->telefono))
            <div class="company-info">Tel: {{ $local->telefono }}</div>
        @endif
    </div>

    {{-- 2. Tipo de Comprobante y Serie/Correlativo --}}
    <div class="doc-section">
        <div class="doc-type">{{ $tipoComprobanteNombre }}</div>
        <div class="doc-number">{{ $numeroComprobanteCompleto }}</div>
    </div>

    {{-- 3. Metadatos de Emisión --}}
    <table class="info-table">
        <tr>
            <td class="col-label">Fecha Emisión</td>
            <td class="col-sep">:</td>
            <td class="col-val">{{ $fechaEmision }} &nbsp; <strong>Hora :</strong> {{ $horaEmision }}</td>
        </tr>
        <tr>
            <td class="col-label">Usuario</td>
            <td class="col-sep">:</td>
            <td class="col-val">{{ $cajeroNombre }}</td>
        </tr>
        <tr>
            <td class="col-label">Cond. Pago</td>
            <td class="col-sep">:</td>
            <td class="col-val">{{ $condicionPago }}</td>
        </tr>
        <tr>
            <td class="col-label">Estado Pago</td>
            <td class="col-sep">:</td>
            <td class="col-val"><strong>{{ $estadoPago }}</strong></td>
        </tr>
        <tr>
            <td class="col-label">Estado Prenda</td>
            <td class="col-sep">:</td>
            <td class="col-val"><strong>{{ $estadoRopa }}</strong></td>
        </tr>
    </table>

    {{-- 4. Sección Cliente --}}
    <div class="client-header">COMPROBANTE A NOMBRE DE :</div>
    <table class="info-table">
        <tr>
            <td class="col-label">Nombre</td>
            <td class="col-sep">:</td>
            <td class="col-val"><strong>{{ $clienteNombre }}</strong></td>
        </tr>
        <tr>
            <td class="col-label">Nro. Iden.</td>
            <td class="col-sep">:</td>
            <td class="col-val">{{ $clienteDocumento }}</td>
        </tr>
        @if(!empty($clienteTelefono))
        <tr>
            <td class="col-label">Teléfono</td>
            <td class="col-sep">:</td>
            <td class="col-val">{{ $clienteTelefono }}</td>
        </tr>
        @endif
    </table>

    {{-- 5. Tabla de Ítems (Distribución exacta Opeluce) --}}
    <table class="items-table">
        <thead>
            <tr>
                <th class="th-cant">Cant.</th>
                <th class="th-punit">P.Unitario</th>
                <th class="th-desc">Desc.</th>
                <th class="th-importe">Importe</th>
            </tr>
            <tr>
                <th colspan="4" class="text-left" style="border: none; padding-bottom: 1px;">Descripción</th>
            </tr>
        </thead>
        <tbody>
            @foreach($comprobante->detalles as $detalle)
            <tr class="item-data-row">
                <td class="td-cant">{{ number_format($detalle->peso_kg, 2) }}</td>
                <td class="td-punit">{{ number_format($detalle->costo_kilo, 2) }}</td>
                <td class="td-desc">0.00</td>
                <td class="td-importe">{{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            <tr class="item-desc-row">
                <td colspan="4">
                    <span class="item-description">{{ strtoupper($detalle->servicio->nom_servicio ?? 'SERVICIO') }}</span>
                    @if(!empty($detalle->observaciones))
                        <span class="item-obs">({{ $detalle->observaciones }})</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- 6. Totales y Cálculos Tributarios --}}
    <table class="totals-table">
        <tr>
            <td class="tot-lbl">Total V.Venta Op. Gravadas</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($opGravadas, 2) }}</td>
        </tr>
        <tr>
            <td class="tot-lbl">Total V.Venta Op. Inafectas</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($opInafectas, 2) }}</td>
        </tr>
        <tr>
            <td class="tot-lbl">Total V.Venta Op.Exonerada</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($opExoneradas, 2) }}</td>
        </tr>
        <tr>
            <td class="tot-lbl">IGV (18%)</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($igv, 2) }}</td>
        </tr>
        <tr class="tot-total-row">
            <td class="tot-lbl">Importe Total</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($costoTotal, 2) }}</td>
        </tr>
        <tr>
            <td class="tot-lbl">Monto Abonado</td>
            <td class="tot-sep">:</td>
            <td class="tot-val">{{ number_format($montoAbonado, 2) }}</td>
        </tr>
        <tr>
            <td class="tot-lbl" style="font-weight: bold;">Saldo Pendiente</td>
            <td class="tot-sep">:</td>
            <td class="tot-val" style="font-weight: bold; color: {{ $montoRestante > 0 ? '#b91c1c' : '#047857' }};">
                {{ number_format($montoRestante, 2) }}
            </td>
        </tr>
    </table>

    {{-- 7. Monto en letras --}}
    <div class="letras-box">
        Son {{ $totalLetras }}
    </div>

    {{-- 8. Código QR SUNAT y Leyenda Oficial --}}
    @if(!empty($qrBase64))
    <div class="qr-section">
        <img src="{{ $qrBase64 }}" class="qr-img" alt="QR SUNAT" />
        <div class="sunat-caption">
            Representación impresa de Comprobante electrónica ,<br>
            consulte en:<br>
            <strong>https://app.sepriet.com</strong>
            @if(!empty($codigoHash))
                <div class="resumen-hash">Resumen: {{ $codigoHash }}</div>
            @endif
        </div>
    </div>
    @endif

    {{-- 9. Términos y Condiciones --}}
    <div class="footer">
        <p>• Conserve este ticket para retirar sus prendas.</p>
        <p>• Plazo máximo de retiro: 30 días calendario.</p>
        <p>• Pasados los 30 días, la empresa no se responsabiliza por prendas no reclamadas.</p>
        <p>• No se aceptan reclamos una vez retirada la prenda.</p>
        <p class="gracias">¡Gracias por su preferencia!</p>
    </div>
</body>
</html>
