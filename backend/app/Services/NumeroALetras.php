<?php

namespace App\Services;

class NumeroALetras
{
    private static array $UNIDADES = [
        '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
    ];

    private static array $DECENAS = [
        '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
    ];

    private static array $CENTENAS = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
        'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    /**
     * Convierte un monto numérico a formato legal peruano:
     * Ejemplo: 45.00 -> "CUARENTA Y CINCO CON 00/100 SOLES"
     */
    public static function convertir(float $monto, string $moneda = 'SOLES'): string
    {
        $monto = round($monto, 2);
        $enteros = (int) floor($monto);
        $centavos = (int) round(($monto - $enteros) * 100);

        if ($enteros === 0) {
            $letras = 'CERO';
        } else {
            $letras = self::convertirEntero($enteros);
        }

        $centavosStr = str_pad((string) $centavos, 2, '0', STR_PAD_LEFT);

        return trim("{$letras} CON {$centavosStr}/100 {$moneda}");
    }

    private static function convertirEntero(int $n): string
    {
        if ($n < 20) {
            return self::$UNIDADES[$n];
        }

        if ($n < 30) {
            return $n === 20 ? 'VEINTE' : 'VEINTI' . self::$UNIDADES[$n - 20];
        }

        if ($n < 100) {
            $d = (int) floor($n / 10);
            $u = $n % 10;
            return self::$DECENAS[$d] . ($u > 0 ? ' Y ' . self::$UNIDADES[$u] : '');
        }

        if ($n === 100) {
            return 'CIEN';
        }

        if ($n < 1000) {
            $c = (int) floor($n / 100);
            $resto = $n % 100;
            return self::$CENTENAS[$c] . ($resto > 0 ? ' ' . self::convertirEntero($resto) : '');
        }

        if ($n < 1000000) {
            $miles = (int) floor($n / 1000);
            $resto = $n % 1000;
            $milesStr = $miles === 1 ? 'MIL' : self::convertirEntero($miles) . ' MIL';
            return $milesStr . ($resto > 0 ? ' ' . self::convertirEntero($resto) : '');
        }

        if ($n < 2000000) {
            $resto = $n % 1000000;
            return 'UN MILLON' . ($resto > 0 ? ' ' . self::convertirEntero($resto) : '');
        }

        $millones = (int) floor($n / 1000000);
        $resto = $n % 1000000;
        return self::convertirEntero($millones) . ' MILLONES' . ($resto > 0 ? ' ' . self::convertirEntero($resto) : '');
    }
}

