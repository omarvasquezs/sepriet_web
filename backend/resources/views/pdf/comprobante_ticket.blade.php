<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $comprobante->cod_comprobante }}</title>
    <style>
        @page {
            margin: 10px 15px;
            size: 80mm 200mm; /* Formato Ticket Térmico estándar 80mm */
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.25;
            color: #111;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #444;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        .logo-title {
            font-size: 15px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .subtitle {
            font-size: 9px;
            color: #444;
            margin: 2px 0;
        }
        .ticket-code {
            font-size: 13px;
            font-weight: bold;
            margin-top: 5px;
            padding: 3px 0;
            border-top: 1px dotted #ccc;
            border-bottom: 1px dotted #ccc;
        }
        .info-section {
            margin-bottom: 8px;
            font-size: 10px;
        }
        .info-row {
            margin: 2px 0;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 75px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 8px;
        }
        .items-table th {
            border-top: 1px dashed #444;
            border-bottom: 1px dashed #444;
            text-align: left;
            padding: 4px 0;
            font-size: 9.5px;
        }
        .items-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            border-top: 1px dashed #444;
            padding-top: 6px;
            margin-bottom: 10px;
            font-size: 10.5px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            text-align: right;
        }
        .total-highlight {
            font-size: 12px;
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-weight: bold;
            font-size: 9px;
            border-radius: 3px;
        }
        .badge-debe { background-color: #fee2e2; color: #991b1b; }
        .badge-abono { background-color: #fef3c7; color: #92400e; }
        .badge-cancelado { background-color: #d1fae5; color: #065f46; }
        .footer {
            border-top: 1px dashed #444;
            padding-top: 8px;
            text-align: center;
            font-size: 8px;
            color: #555;
            line-height: 1.2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="logo-title">LAVANDERIA SEPRIET</h1>
        <div class="subtitle">{{ $local->nombre ?? 'Oficina Principal' }}</div>
        <div class="subtitle">{{ $local->direccion ?? 'Av. Agustín de la Rosa Toro 318, San Luis' }}</div>
        <div class="subtitle">Tel: {{ $local->telefono ?? '913 027 176' }}</div>
        <div class="ticket-code">
            {{ $tipoComprobanteNombre }}: {{ $comprobante->cod_comprobante }}
        </div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">CLIENTE:</span>
            <span>{{ strtoupper($comprobante->cliente->nombres ?? 'CLIENTE VARIOS') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">DNI / RUC:</span>
            <span>{{ $comprobante->cliente->dni ?? 'N/A' }}</span>
        </div>
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
            <span class="info-label">ESTADO PAGO:</span>
            <span class="badge {{ $badgeClass }}">
                {{ $comprobante->estadoComprobante->nom_estado ?? 'DEBE' }}
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">ESTADO PRENDA:</span>
            <span><b>{{ $comprobante->estadoRopa->nom_estado_ropa ?? 'RECIBIDO' }}</b></span>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 20%;">CANT/KG</th>
                <th style="width: 55%;">SERVICIO</th>
                <th style="width: 25%;" class="text-right">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($comprobante->detalles as $detalle)
            <tr>
                <td>{{ number_format($detalle->peso_kg, 2) }}</td>
                <td>
                    {{ $detalle->servicio->nom_servicio ?? 'Servicio' }}
                    @if(!empty($detalle->observaciones))
                        <br><small style="color: #666;">({{ $detalle->observaciones }})</small>
                    @endif
                </td>
                <td class="text-right">S/ {{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-section">
        <div class="total-row">
            <span>COSTO TOTAL: </span>
            <span><b>S/ {{ number_format($comprobante->costo_total, 2) }}</b></span>
        </div>
        <div class="total-row">
            <span>MONTO ABONADO: </span>
            <span>S/ {{ number_format($comprobante->monto_abonado, 2) }}</span>
        </div>
        <div class="total-row total-highlight">
            <span>SALDO PENDIENTE: </span>
            <span>S/ {{ number_format($comprobante->monto_restante, 2) }}</span>
        </div>
    </div>

    <div class="footer">
        <p>• Conserve este ticket para retirar sus prendas.</p>
        <p>• Plazo máximo de retiro: 30 días calendario.</p>
        <p>• Pasados los 30 días, la empresa no se responsabiliza por prendas no reclamadas.</p>
        <p>• No se aceptan reclamos una vez retirada la prenda.</p>
        <p style="margin-top: 5px; font-weight: bold;">¡Gracias por su preferencia!</p>
    </div>
</body>
</html>
