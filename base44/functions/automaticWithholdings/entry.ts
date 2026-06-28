import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * RETENCIONES Y PERCEPCIONES - IIBB, IVA, GANANCIAS
 * Calcula, certifica y gestiona retenciones aplicables
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, period, withholding_type, taxable_base, rate, document_data } = await req.json();

    if (action === 'calculate_withholding') {
      return await calculateWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate);
    }

    if (action === 'create_withholding') {
      return await createWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate, document_data);
    }

    if (action === 'generate_certificates') {
      return await generateCertificates(base44, user, client_id, period);
    }

    if (action === 'submit_payments') {
      return await submitPayments(base44, user, client_id, period);
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error en Retenciones:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Calcula retención según tipo y régimen
 */
async function calculateWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate) {
  const client = await base44.entities.Client.get(client_id);
  
  // Alícuotas por defecto según tipo
  const defaultRates = {
    iibb_local: 3.5, // CABA default
    iibb_cm: 2.5, // CM default
    iva: 10.5, // IVA retención default
    ganancias: 6, // Ganancias retención default
    sellos: 1.2, // Sellos default
    sscc: 5 // Seguridad social
  };

  const appliedRate = rate || defaultRates[withholding_type] || 0;
  const amount = taxable_base * (appliedRate / 100);

  return Response.json({
    success: true,
    withholding_type,
    taxable_base,
    rate: appliedRate,
    amount,
    regime: getRegimenName(withholding_type),
    message: `Retención calculada: $${amount.toLocaleString('es-AR')}`
  });
}

/**
 * Crea retención certificada
 */
async function createWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate, document_data) {
  const client = await base44.entities.Client.get(client_id);
  
  const appliedRate = rate || getDefaultRate(withholding_type);
  const amount = taxable_base * (appliedRate / 100);

  const withholding = await base44.entities.Withholding.create({
    company_id: client.company_id,
    client_id,
    client_name: client.business_name,
    withholding_type,
    regime: getRegimenName(withholding_type),
    period,
    document_type: document_data?.document_type || 'factura_a',
    document_number: document_data?.document_number || '',
    document_date: document_data?.document_date || new Date().toISOString().split('T')[0],
    issuer_cuit: document_data?.issuer_cuit || '',
    issuer_name: document_data?.issuer_name || '',
    taxable_base: taxable_base,
    rate: appliedRate,
    amount,
    status: 'pending',
    jurisdiction: getJurisdiction(withholding_type)
  });

  return Response.json({
    success: true,
    record_id: withholding.id,
    withholding_type,
    taxable_base,
    rate: appliedRate,
    amount,
    message: 'Retención creada - pendiente de certificación'
  });
}

/**
 * Genera certificados de retención del período
 */
async function generateCertificates(base44, user, client_id, period) {
  const withholdings = await base44.entities.Withholding.filter({
    client_id,
    period,
    status: 'pending'
  });

  if (!withholdings || withholdings.length === 0) {
    return Response.json({
      success: true,
      message: 'No hay retenciones pendientes de certificar'
    });
  }

  // Actualizar a estado "certified"
  for (const w of withholdings) {
    await base44.entities.Withholding.update(w.id, {
      status: 'certified',
      certificate_number: `CERT-${w.id}-${Date.now()}`,
      certificate_date: new Date().toISOString().split('T')[0]
    });
  }

  return Response.json({
    success: true,
    certificates_generated: withholdings.length,
    total_amount: withholdings.reduce((sum, w) => sum + (w.amount || 0), 0),
    message: `${withholdings.length} certificados generados`
  });
}

/**
 * Presenta pagos de retenciones al fisco
 */
async function submitPayments(base44, user, client_id, period) {
  const withholdings = await base44.entities.Withholding.filter({
    client_id,
    period,
    status: 'certified'
  });

  if (!withholdings || withholdings.length === 0) {
    return Response.json({
      error: 'No hay retenciones certificadas para pagar',
      requires_certification: true
    }, { status: 400 });
  }

  const totalAmount = withholdings.reduce((sum, w) => sum + (w.amount || 0), 0);
  const submissionDate = new Date().toISOString().split('T')[0];

  // Actualizar estado
  for (const w of withholdings) {
    await base44.entities.Withholding.update(w.id, {
      status: 'paid',
      payment_date: submissionDate,
      vep_number: `VEP-${w.withholding_type}-${Date.now()}`
    });
  }

  // Log de auditoría
  await base44.entities.AuditLog.create({
    user_id: user.id,
    user_email: user.email,
    action: 'approve',
    entity_type: 'Withholding',
    description: `Presentó ${withholdings.length} retenciones del período ${period}`,
    client_id,
    metadata: JSON.stringify({
      period,
      total_amount: totalAmount,
      count: withholdings.length
    })
  });

  return Response.json({
    success: true,
    message: `${withholdings.length} retenciones presentadas - Total: $${totalAmount.toLocaleString('es-AR')}`,
    total_amount: totalAmount,
    submission_date: submissionDate
  });
}

/**
 * Obtiene nombre del régimen según tipo
 */
function getRegimenName(type) {
  const regimenes = {
    iibb_local: 'RG ARCA 3665 - IIBB Local',
    iibb_cm: 'CM 03/2020 - Convenio Multilateral',
    iva: 'RG AFIP 4504 - Retención IVA',
    ganancias: 'RG AFIP 4167 - Retención Ganancias',
    sellos: 'Código Fiscal - Sellos',
    sscc: 'RG AFIP 1415 - Seguridad Social'
  };
  return regimenes[type] || 'Régimen General';
}

/**
 * Obtiene alícuota default según tipo
 */
function getDefaultRate(type) {
  const rates = {
    iibb_local: 3.5,
    iibb_cm: 2.5,
    iva: 10.5,
    ganancias: 6,
    sellos: 1.2,
    sscc: 5
  };
  return rates[type] || 0;
}

/**
 * Obtiene jurisdicción según tipo
 */
function getJurisdiction(type) {
  if (type === 'iibb_local' || type === 'sellos') return 'caba';
  if (type === 'iibb_cm') return 'otra';
  return 'nacional';
}