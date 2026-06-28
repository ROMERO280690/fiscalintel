import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * RETENCIONES Y PERCEPCIONES - IIBB, IVA, GANANCIAS
 * Calcula, certifica y presenta retenciones
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, period, withholding_type, taxable_base, rate } = await req.json();

    if (action === 'calculate_withholding') {
      return await calculateWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate);
    }

    if (action === 'generate_certificate') {
      return await generateCertificate(base44, user, client_id, period);
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
 * Calcula retención según tipo y alícuota
 */
async function calculateWithholding(base44, user, client_id, period, withholding_type, taxable_base, rate) {
  const client = await base44.entities.Client.get(client_id);
  const amount = taxable_base * (rate / 100);

  const withholding = await base44.entities.Withholding.create({
    company_id: client?.company_id,
    client_id,
    client_name: client?.business_name,
    withholding_type,
    period,
    taxable_base,
    rate,
    amount,
    status: 'pending'
  });

  return Response.json({
    success: true,
    withholding_id: withholding.id,
    withholding_type,
    taxable_base,
    rate,
    amount,
    message: `Retención calculada: $${amount.toLocaleString('es-AR')}`
  });
}

/**
 * Genera certificado de retención
 */
async function generateCertificate(base44, user, client_id, period) {
  const withholdings = await base44.entities.Withholding.filter({
    client_id,
    period,
    status: 'pending'
  });

  if (!withholdings || withholdings.length === 0) {
    return Response.json({ 
      error: 'No hay retenciones pendientes para certificar',
      requires_calculation: true
    }, { status: 400 });
  }

  // Actualizar a certificadas
  for (const w of withholdings) {
    await base44.entities.Withholding.update(w.id, {
      status: 'certified',
      certificate_number: `CERT-${Date.now()}-${w.id}`,
      certificate_date: new Date().toISOString().split('T')[0]
    });
  }

  return Response.json({
    success: true,
    certified_count: withholdings.length,
    total_amount: withholdings.reduce((sum, w) => sum + (w.amount || 0), 0),
    message: `${withholdings.length} certificados generados`
  });
}

/**
 * Presenta pagos de retenciones
 */
async function submitPayments(base44, user, client_id, period) {
  const withholdings = await base44.entities.Withholding.filter({
    client_id,
    period,
    status: 'certified'
  });

  if (!withholdings || withholdings.length === 0) {
    return Response.json({ 
      error: 'No hay retenciones certificadas para presentar',
      requires_certification: true
    }, { status: 400 });
  }

  const totalAmount = withholdings.reduce((sum, w) => sum + (w.amount || 0), 0);
  const submissionDate = new Date().toISOString().split('T')[0];

  // Actualizar a pagadas
  for (const w of withholdings) {
    await base44.entities.Withholding.update(w.id, {
      status: 'paid',
      payment_date: submissionDate,
      vep_number: `VEP-${Date.now()}-${w.id}`
    });
  }

  // Log de auditoría
  await base44.entities.AuditLog.create({
    user_id: user.id,
    user_email: user.email,
    action: 'approve',
    entity_type: 'Withholding',
    description: `Presentó retenciones ${period} - Total: $${totalAmount.toLocaleString('es-AR')}`,
    client_id
  });

  return Response.json({
    success: true,
    submitted_count: withholdings.length,
    total_amount: totalAmount,
    submission_date: submissionDate,
    message: 'Retenciones presentadas exitosamente'
  });
}