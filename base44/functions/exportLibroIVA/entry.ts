import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id, period_from, period_to, type } = await req.json();
    
    if (!client_id || !period_from || !period_to || !type) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const client = await base44.entities.Client.get(client_id);
    const docs = await base44.entities.Document.filter({
      client_id,
      category: type === 'compras' ? 'iva_compras' : 'iva_ventas',
      status: 'approved',
      date: { $gte: period_from, $lte: period_to }
    });

    // Formato Libro de IVA Digital AFIP
    // Cada línea representa un comprobante
    let txtContent = '';
    
    docs.forEach((doc, index) => {
      const line = [
        (index + 1).toString().padStart(6, '0'), // Nro de línea
        doc.date?.replace(/-/g, '') || '', // Fecha (YYYYMMDD)
        doc.doc_type?.toUpperCase() || 'OTRO', // Tipo de comprobante
        (doc.point_of_sale || '0000').padStart(4, '0'), // Punto de venta
        (doc.invoice_number || '00000000').padStart(8, '0'), // Número de comprobante
        (doc.issuer_cuit || client.cuit || '').replace(/-/g, ''), // CUIT emisor/receptor
        (doc.net_amount || 0).toFixed(2).replace('.', ','), // Neto gravado
        (doc.tax_amount || 0).toFixed(2).replace('.', ','), // IVA
        (doc.amount || 0).toFixed(2).replace('.', ','), // Total
        '0.00', // Exento
        '0.00', // No gravado
        '0.00', // Percepciones
        '0.00', // Percepciones IIBB
      ].join('|');
      
      txtContent += line + '\n';
    });

    // Agregar cabecera con datos del contribuyente
    const header = [
      'LIBRO IVA DIGITAL',
      `Tipo: ${type.toUpperCase()}`,
      `Contribuyente: ${client.business_name}`,
      `CUIT: ${client.cuit}`,
      `Período: ${period_from} al ${period_to}`,
      `Total comprobantes: ${docs.length}`,
      '',
      'Nro Línea|Fecha|Tipo|Pto Vta|Nro Cpe|CUIT|Neto|IVA|Total|Exento|No Grav|Percepciones|IIBB',
    ].join('\n') + '\n\n';

    const fullContent = header + txtContent;

    return new Response(fullContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="LibroIVA_${type}_${client_id}_${period_from}.txt"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});