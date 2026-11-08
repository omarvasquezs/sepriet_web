<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $comprobante->cod_comprobante }} - A4</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 24mm 22mm 24mm 22mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.35;
            color: #1e293b;
            background: #ffffff;
        }

        .w-100 { width: 100%; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        /* Header Layout */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }
        .header-table td {
            vertical-align: top;
        }
        .header-logo-cell {
            width: 56%;
            padding-right: 18px;
        }
        .logo-img {
            max-width: 240px;
            max-height: 75px;
            width: auto;
            height: auto;
            margin-bottom: 8px;
            display: block;
        }
        .company-name {
            font-size: 12.5pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
            letter-spacing: 0.3px;
        }
        .company-info {
            font-size: 8.5pt;
            color: #475569;
            line-height: 1.35;
            margin-bottom: 1px;
        }

        /* SUNAT Box */
        .sunat-box-cell {
            width: 44%;
        }
        .sunat-box {
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            text-align: center;
            padding: 10px 14px;
            background: #ffffff;
        }
        .sunat-box-ruc {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
        }
        .sunat-box-type {
            font-size: 10.5pt;
            font-weight: bold;
            background: #1e3a8a;
            color: #ffffff;
            padding: 5px 8px;
            margin: 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 3px;
        }
        .sunat-box-number {
            font-size: 11.5pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 5px;
        }

        /* Client Info Section */
        .client-box {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
            margin-bottom: 18px;
            padding: 10px 14px;
        }
        .client-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
        }
        .client-table td {
            padding: 3.5px 6px;
            vertical-align: top;
        }
        .lbl {
            font-weight: bold;
            color: #334155;
            white-space: nowrap;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 8.5pt;
        }
        .items-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            padding: 8px 10px;
            border: 1px solid #1e3a8a;
            text-align: center;
        }
        .items-table td {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        .items-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .item-obs {
            font-size: 7.5pt;
            color: #64748b;
            font-style: italic;
            margin-top: 2px;
        }

        /* Bottom Section: Left (Legal/QR) + Right (Totals) */
        .bottom-table {
            width: 100%;
            border-collapse: collapse;
        }
        .bottom-table td {
            vertical-align: top;
        }
        .bottom-left-cell {
            width: 56%;
            padding-right: 18px;
        }
        .bottom-right-cell {
            width: 44%;
        }

        /* Monto en letras */
        .letras-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 8.5pt;
            font-weight: bold;
            margin-bottom: 12px;
        }

        /* QR + Legal Text */
        .qr-legal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .qr-legal-table td {
            vertical-align: middle;
        }
        .qr-img {
            width: 85px;
            height: 85px;
            display: block;
        }
        .legal-text {
            font-size: 7.5pt;
            color: #475569;
            line-height: 1.35;
            padding-left: 12px;
        }
        .legal-hash {
            font-size: 6.8pt;
            color: #64748b;
            margin-top: 4px;
            word-break: break-all;
        }

        /* Terms / Notes */
        .terms-box {
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 7.2pt;
            color: #64748b;
            line-height: 1.35;
        }

        /* Totals Table */
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
        }
        .totals-table td {
            padding: 5px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .tot-row-total td {
            background-color: #f1f5f9;
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
            padding: 7px 10px;
            border-top: 1.5px solid #cbd5e1;
            border-bottom: 1.5px solid #cbd5e1;
        }
        .tot-saldo-debe {
            color: #b91c1c;
            font-weight: bold;
        }
        .tot-saldo-pagado {
            color: #047857;
            font-weight: bold;
        }
    </style>
</head>
<body>

    {{-- 1. Cabecera / Header --}}
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo Sepriet" class="logo-img" />
                @endif
                <div class="company-name">LAVANDERIA SEPRIET</div>
                <div class="company-info">RUC {{ $empresaRuc }}</div>
                <div class="company-info">{{ strtoupper($local->direccion ?? 'JR. ENRIQUE NERINI N° 995 URB. SAN LUIS') }}</div>
                <div class="company-info">Tel / Cel: {{ $local->telefono ?? '+51 944 864 652' }}</div>
            </td>
            <td class="sunat-box-cell">
                <div class="sunat-box">
                    <div class="sunat-box-ruc">R.U.C. N° {{ $empresaRuc }}</div>
                    <div class="sunat-box-type">{{ $tipoComprobanteNombre }}</div>
                    <div class="sunat-box-number">{{ $numeroComprobanteCompleto }}</div>
                </div>
            </td>
        </tr>
    </table>

    {{-- 2. Datos del Cliente y Emisión --}}
    <div class="client-box">
        <table class="client-table">
            <tr>
                <td style="width: 14%;" class="lbl">SEÑOR(ES):</td>
                <td style="width: 44%;" class="bold uppercase">{{ $clienteNombre }}</td>
                <td style="width: 18%;" class="lbl">FECHA EMISIÓN:</td>
                <td style="width: 24%;">{{ $fechaEmision }} {{ $horaEmision }}</td>
            </tr>
            <tr>
                <td class="lbl">N° IDENT.:</td>
                <td class="uppercase">{{ !empty($comprobante->num_ruc) ? 'RUC ' . $comprobante->num_ruc : 'DNI ' . $clienteDocumento }}</td>
                <td class="lbl">COND. PAGO:</td>
                <td class="bold uppercase">{{ $condicionPago }}</td>
            </tr>
            <tr>
                <td class="lbl">DIRECCIÓN:</td>
                <td class="uppercase">{{ !empty($comprobante->cliente->direccion) ? $comprobante->cliente->direccion : '-' }}</td>
                <td class="lbl">MONEDA:</td>
                <td>SOLES (PEN)</td>
            </tr>
            <tr>
                <td class="lbl">TELÉFONO:</td>
                <td>{{ !empty($clienteTelefono) ? $clienteTelefono : '-' }}</td>
                <td class="lbl">ATENDIDO POR:</td>
                <td class="uppercase">{{ $cajeroNombre }}</td>
            </tr>
            <tr>
                <td class="lbl">EST. PRENDA:</td>
                <td class="bold uppercase">{{ $estadoRopa }}</td>
                <td class="lbl">EST. PAGO:</td>
                <td class="bold uppercase">{{ $estadoPago }}</td>
            </tr>
        </table>
    </div>

    {{-- 3. Tabla de Ítems / Servicios --}}
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 6%;">ITEM</th>
                <th style="width: 12%;">CANTIDAD</th>
                <th style="width: 10%;">UNIDAD</th>
                <th style="width: 44%; text-align: left; padding-left: 10px;">DESCRIPCIÓN DEL SERVICIO</th>
                <th style="width: 14%; text-align: right; padding-right: 10px;">P. UNITARIO</th>
                <th style="width: 14%; text-align: right; padding-right: 10px;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($comprobante->detalles as $index => $detalle)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-center">{{ number_format($detalle->peso_kg, 2) }}</td>
                <td class="text-center">{{ $detalle->peso_kg > 0 ? 'KGM' : 'NIU' }}</td>
                <td style="padding-left: 10px;">
                    <span class="bold uppercase">{{ $detalle->servicio->nom_servicio ?? 'SERVICIO DE LAVANDERIA' }}</span>
                    @if(!empty($detalle->observaciones))
                        <div class="item-obs">Obs: {{ $detalle->observaciones }}</div>
                    @endif
                </td>
                <td class="text-right" style="padding-right: 10px;">S/ {{ number_format($detalle->costo_kilo, 2) }}</td>
                <td class="text-right bold" style="padding-right: 10px;">S/ {{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- 4. Totales, QR y Liquidación --}}
    <table class="bottom-table">
        <tr>
            <td class="bottom-left-cell">
                <div class="letras-card">
                    SON: {{ $totalLetras }}
                </div>

                @if(!empty($qrBase64))
                <table class="qr-legal-table">
                    <tr>
                        <td style="width: 85px;">
                            <img src="{{ $qrBase64 }}" class="qr-img" alt="Código QR SUNAT" />
                        </td>
                        <td class="legal-text">
                            <div><strong>Representación impresa de la {{ $tipoComprobanteNombre }}</strong></div>
                            <div>Autorizada mediante resolución de superintendencia de la SUNAT.</div>
                            @if(!empty($codigoHash))
                                <div class="legal-hash">Código Hash: {{ $codigoHash }}</div>
                            @endif
                        </td>
                    </tr>
                </table>
                @endif

                <div class="terms-box">
                    <p>• Conserve este comprobante para retirar sus prendas del establecimiento.</p>
                    <p>• Plazo máximo de retiro: 30 días calendario contados desde la recepción.</p>
                    <p>• No se aceptan reclamos una vez retiradas las prendas del local.</p>
                    <p style="margin-top: 4px; font-weight: bold; color: #1e3a8a;">¡Gracias por su preferencia!</p>
                </div>
            </td>

            <td class="bottom-right-cell">
                <table class="totals-table">
                    <tr>
                        <td class="lbl">Op. Gravadas</td>
                        <td class="text-right">S/ {{ number_format($opGravadas, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">Op. Inafectas</td>
                        <td class="text-right">S/ {{ number_format($opInafectas, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">Op. Exoneradas</td>
                        <td class="text-right">S/ {{ number_format($opExoneradas, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">I.G.V. (18%)</td>
                        <td class="text-right">S/ {{ number_format($igv, 2) }}</td>
                    </tr>
                    <tr class="tot-row-total">
                        <td class="lbl">TOTAL A PAGAR</td>
                        <td class="text-right">S/ {{ number_format($costoTotal, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">Monto Abonado</td>
                        <td class="text-right">S/ {{ number_format($montoAbonado, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">Saldo Pendiente</td>
                        <td class="text-right {{ $montoRestante > 0 ? 'tot-saldo-debe' : 'tot-saldo-pagado' }}">
                            S/ {{ number_format($montoRestante, 2) }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>
