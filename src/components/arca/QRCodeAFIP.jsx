import React from "react";

/**
 * QR CODE PARA FACTURACIÓN ELECTRÓNICA - RG ARCA 5616/2024
 * Genera QR oficial de AFIP con URL: https://www.afip.gob.ar/fe/qr/?p=...
 * 
 * El QR debe contener un JSON con:
 * - ver: 1 (versión)
 * - fecha: fecha de emisión (YYYY-MM-DD)
 * - cuit: CUIT del emisor
 * - ptoVta: punto de venta
 * - tipoCmp: tipo de comprobante
 * - nroCmp: número de comprobante
 * - importe: importe total
 * - moneda: PES (pesos)
 * - ctz: 1 (cotización)
 * - tipoDocRec: tipo de documento receptor (96 = CUIT)
 * - nroDocRec: número de documento receptor
 * - tipoCodAut: tipo de código de autorización (E = CAE)
 * - codAut: CAE
 */
export default function QRCodeAFIP({ invoice, client, size = 160 }) {
  // Generar URL del QR según RG 5616/2024
  const qrData = {
    ver: 1,
    fecha: invoice.date,
    cuit: client?.cuit || invoice.receiver_cuit,
    ptoVta: parseInt(invoice.point_of_sale) || 1,
    tipoCmp: getCbteTipo(invoice.invoice_type),
    nroCmp: parseInt(invoice.invoice_number) || 0,
    importe: invoice.total_amount || 0,
    moneda: "PES",
    ctz: 1,
    tipoDocRec: 96, // CUIT
    nroDocRec: parseInt((invoice.receiver_cuit || "0").replace(/-/g, "")) || 0,
    tipoCodAut: "E", // CAE
    codAut: invoice.cae_number || ""
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${encodeURIComponent(qrString)}`;
  
  // API de QR: qrserver.com (gratuita, sin auth)
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="flex flex-col items-center">
      <img 
        src={qrImage} 
        alt="QR AFIP" 
        className="w-32 h-32 border-2 border-slate-200 rounded-lg"
        width={size}
        height={size}
      />
      <p className="text-[9px] text-slate-500 mt-1 text-center">
        Escaneá para verificar en AFIP
      </p>
    </div>
  );
}

function getCbteTipo(invoiceType) {
  const map = {
    'factura_a': 1,
    'factura_b': 6,
    'factura_c': 11,
    'factura_m': 51,
    'factura_e': 19,
    'nota_credito_a': 2,
    'nota_credito_b': 7,
    'nota_credito_c': 12,
    'nota_debito_a': 3,
    'nota_debito_b': 8,
    'nota_debito_c': 13
  };
  return map[invoiceType] || 99;
}