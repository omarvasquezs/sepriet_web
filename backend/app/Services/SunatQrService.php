<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Models\Local;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Carbon\Carbon;

class SunatQrService
{
    /**
     * Construye la cadena según especificación técnica SUNAT (RS 097-2012/SUNAT):
     * [RUC emisor]|[Tipo de comprobante]|[Serie]|[Número]|[IGV]|[Total]|[Fecha]|[Tipo doc cliente]|[Num doc cliente]|[Código hash]|
     */
    public static function buildSunatQrString(Comprobante $comprobante, ?Local $local = null): string
    {
        // 1. RUC Emisor de la empresa
        $rucEmisor = config('services.sunat.ruc', env('EMPRESA_RUC', '15614550373'));
        if ($local && !empty($local->ruc)) {
            $rucEmisor = preg_replace('/\D/', '', $local->ruc);
        }

        // 2. Tipo de Comprobante (Catálogo 01 SUNAT)
        $tipoDocSunat = match ($comprobante->tipo_comprobante) {
            'F' => '01', // Factura Electrónica
            'B' => '03', // Boleta de Venta Electrónica
            default => '00', // Nota de Venta / Comprobante de Control Interno
        };

        // 3. Serie y Número correlativo
        $cod = $comprobante->cod_comprobante ?? '';
        $parts = explode('-', $cod);
        $serie = $parts[0] ?? ($comprobante->tipo_comprobante === 'F' ? 'FV001' : ($comprobante->tipo_comprobante === 'B' ? 'BV001' : 'NV001'));
        $numero = isset($parts[1]) ? ltrim($parts[1], '0') : (string)$comprobante->id;
        if ($numero === '') {
            $numero = (string)$comprobante->id;
        }

        // 4. Cálculos tributarios IGV (18%)
        $costoTotal = (float)($comprobante->costo_total ?? 0);
        $igv = 0.00;
        if ($comprobante->tipo_comprobante === 'F' || $comprobante->tipo_comprobante === 'B') {
            $base = round($costoTotal / 1.18, 2);
            $igv = round($costoTotal - $base, 2);
        }

        // 5. Fecha de emisión YYYY-MM-DD
        $fecha = Carbon::parse($comprobante->fecha ?? now())->format('Y-m-d');

        // 6. Tipo y Número de Documento del Cliente (Catálogo 06 SUNAT)
        $clienteDoc = trim($comprobante->cliente->dni ?? '');
        if (empty($clienteDoc) && !empty($comprobante->num_ruc)) {
            $clienteDoc = trim((string)$comprobante->num_ruc);
        }

        $tipoDocCliente = '0'; // Sin documento / Varios
        $numDocCliente = '-';

        if (!empty($comprobante->num_ruc) || strlen($clienteDoc) === 11) {
            $tipoDocCliente = '6'; // RUC
            $numDocCliente = !empty($comprobante->num_ruc) ? (string)$comprobante->num_ruc : $clienteDoc;
        } elseif (strlen($clienteDoc) === 8) {
            $tipoDocCliente = '1'; // DNI
            $numDocCliente = $clienteDoc;
        } elseif (strlen($clienteDoc) > 0) {
            $tipoDocCliente = '4'; // Carnet de Extranjería / Otro
            $numDocCliente = $clienteDoc;
        }

        // 7. Código Hash de seguridad (SHA-256)
        $hashSource = "{$rucEmisor}|{$tipoDocSunat}|{$serie}|{$numero}|{$costoTotal}|{$fecha}|{$numDocCliente}";
        $codigoHash = strtoupper(substr(hash('sha256', $hashSource), 0, 28));

        return sprintf(
            "%s|%s|%s|%s|%.2f|%.2f|%s|%s|%s|%s|",
            $rucEmisor,
            $tipoDocSunat,
            $serie,
            $numero,
            $igv,
            $costoTotal,
            $fecha,
            $tipoDocCliente,
            $numDocCliente,
            $codigoHash
        );
    }

    /**
     * Genera imagen PNG Base64 del código QR optimizada para cabezal térmico de 80mm
     */
    public static function generateQrBase64(string $text, int $scale = 3): string
    {
        $options = new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'outputBase64' => true,
            'scale' => $scale,
            'addQuietzone' => true,
            'quietzoneSize' => 2,
            'imageTransparent' => false,
        ]);

        return (new QRCode($options))->render($text);
    }

    /**
     * Extrae el código hash para mostrarlo en el texto de la representación impresa
     */
    public static function getCodigoHash(Comprobante $comprobante, ?Local $local = null): string
    {
        $qrString = self::buildSunatQrString($comprobante, $local);
        $parts = explode('|', $qrString);
        return $parts[9] ?? strtoupper(substr(md5($comprobante->cod_comprobante), 0, 24));
    }
}
