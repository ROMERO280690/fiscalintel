import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTOMATIZACIÓN IIBB - CONVENIO MULTILATERAL / RÉGIMEN LOCAL
 * Calcula coeficientes, base imponible e impuesto
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, period, province, regime } = await req.json();

    if (action === 'calculate_iibb') {
      return await calculateIIBB(base44, user, client_id, period, province, regime);
    }

    if (action === 'generate_ddjj') {
      return await generateDDJJIIBB(base44, user, client_id, period, province);
    }

    if (action === 'submit_ddjj') {
      return await submitDDJJIIBB(base44, user, client_id, period);
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error en automatización IIBB:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Calcula IIBB del período
 */
async function calculateIIBB(base44, user, client_id, period, province = 'CABA', regime = 'local') {
  const client = await base44.entities.Client.get(client_id);
  
  // Obtener facturas de ventas del período
  const invoices = await base44.entities.Invoice.filter({
    client_id,
    period,
    status: 'issued'
  });

  // Calcular ingresos brutos por jurisdicción
  let ingresosBrutos = 0;
  const ventasDetalle = [];

  for (const invoice of invoices) {
    ingresosBrutos += invoice.net_amount || 0;
    ventasDetalle.push({
      tipo: invoice.invoice_type,
      numero: invoice.invoice_number,
      neto: invoice.net_amount || 0,
      iva: invoice.iva_amount || 0,
      total: invoice.total_amount || 0
    });
  }

  // Obtener coeficientes históricos o calcular
  const coefficients = await base44.entities.IIBBCoefficient.filter({
    client_id,
    period
  });

  // Por defecto, pero el contador debe cargar coeficientes reales según jurisdicción
  // CABA: 3.5%, Buenos Aires: varía por actividad, Córdoba: 3%, etc.
  let coeficienteIngresos = 0.5; // Default 50% (debe completarse con CM real)
  let aliquot = 3.5; // Alícuota estándar CABA

  if (coefficients && coefficients.length > 0) {
    const lastCoeff = coefficients[0];
    coeficienteIngresos = lastCoeff.income_coefficient || 0.5;
    aliquot = lastCoeff.aliquot || 3.5;
  }

  // Cálculo IIBB
  const baseImponible = ingresosBrutos * coeficienteIngresos;
  const impuesto = baseImponible * (aliquot / 100);

  // Guardar coeficientes
  const iibbCoeff = await base44.entities.IIBBCoefficient.create({
    client_id,
    client_name: client.business_name,
    period,
    regime,
    province,
    income_coefficient: coeficienteIngresos,
    taxable_base: baseImponible,
    aliquot,
    tax_amount: impuesto,
    status: 'calculated'
  });

  // Crear DDJJ
  const taxFiling = await base44.entities.TaxFiling.create({
    client_id,
    client_name: client.business_name,
    filing_type: regime === 'local' ? 'iibb' : 'convenio_multilateral',
    period,
    status: 'ai_generated',
    tax_payable: impuesto,
    due_date: calculateIIBBDueDate(period, province),
    ai_notes: `Base: $${baseImponible.toLocaleString('es-AR')} | Alícuota: ${aliquot}%`,
    ai_risk_flags: JSON.stringify({
      ingresos_brutos: ingresosBrutos,
      coeficiente: coeficienteIngresos,
      base_imponible: baseImponible,
      aliquot,
      impuesto: impuesto,
      ventas_count: invoices.length,
      regime,
      province
    })
  });

  return Response.json({
    success: true,
    tax_filing_id: taxFiling.id,
    coeff_id: iibbCoeff.id,
    period,
    province,
    regime,
    ingresos_brutos: ingresosBrutos,
    coeficiente_ingresos: coeficienteIngresos,
    base_imponible: baseImponible,
    aliquot,
    impuesto_a_pagar: impuesto,
    ventas: ventasDetalle,
    due_date: calculateIIBBDueDate(period, province)
  });
}

/**
 * Genera borrador DDJJ IIBB
 */
async function generateDDJJIIBB(base44, user, client_id, period, province) {
  const taxFilings = await base44.entities.TaxFiling.filter({
    client_id,
    filing_type: ['iibb', 'convenio_multilateral'],
    period,
    status: 'ai_generated'
  });

  if (!taxFilings || taxFilings.length === 0) {
    return Response.json({ 
      error: 'Primero calculá IIBB del período',
      requires_calculation: true
    }, { status: 400 });
  }

  const filing = taxFilings[0];
  const riskData = filing.ai_risk_flags ? JSON.parse(filing.ai_risk_flags) : null;

  await base44.entities.TaxFiling.update(filing.id, {
    status: 'review'
  });

  return Response.json({
    success: true,
    filing_id: filing.id,
    message: 'DDJJ IIBB generada lista para revisión',
    data: {
      period: filing.period,
      base_imponible: riskData?.base_imponible || 0,
      aliquot: riskData?.aliquot || 0,
      impuesto_a_pagar: filing.tax_payable,
      vencimiento: filing.due_date,
      province: riskData?.province,
      regime: riskData?.regime,
      risk_flags: riskData
    }
  });
}

/**
 * Presenta DDJJ IIBB
 */
async function submitDDJJIIBB(base44, user, client_id, period) {
  const taxFilings = await base44.entities.TaxFiling.filter({
    client_id,
    filing_type: ['iibb', 'convenio_multilateral'],
    period,
    status: 'review'
  });

  if (!taxFilings || taxFilings.length === 0) {
    return Response.json({ 
      error: 'No hay DDJJ en estado de revisión',
      requires_review: true
    }, { status: 400 });
  }

  const filing = taxFilings[0];
  const submissionDate = new Date().toISOString().split('T')[0];
  
  await base44.entities.TaxFiling.update(filing.id, {
    status: 'submitted',
    submission_date: submissionDate,
    vep_number: `VEP-IIBB-${Date.now()}`
  });

  await base44.entities.AuditLog.create({
    user_id: user.id,
    user_email: user.email,
    action: 'approve',
    entity_type: 'TaxFiling',
    entity_id: filing.id,
    description: `Presentó DDJJ IIBB ${period}`,
    client_id: client_id
  });

  return Response.json({
    success: true,
    message: 'DDJJ IIBB presentada exitosamente',
    submission_date: submissionDate
  });
}

/**
 * Calcula vencimiento IIBB (varía por jurisdicción)
 */
function calculateIIBBDueDate(period, province = 'CABA') {
  const [month, year] = period.split('/').map(Number);
  
  // Vencimientos estándar por jurisdicción
  const vencimientos = {
    'CABA': 20,
    'Buenos Aires': 18,
    'Córdoba': 15,
    'Santa Fe': 22
  };

  const day = vencimientos[province] || 20;
  const dueDate = new Date(year, month, day);
  return dueDate.toISOString().split('T')[0];
}