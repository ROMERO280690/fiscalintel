import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTOMATIZACIÓN SUELDOS - LIQUIDACIÓN Y F.931
 * Calcula sueldos, cargas sociales y genera presentación
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, period, employee_ids } = await req.json();

    if (action === 'calculate_payroll') {
      return await calculatePayroll(base44, user, client_id, period, employee_ids);
    }

    if (action === 'generate_payslips') {
      return await generatePayslips(base44, user, client_id, period);
    }

    if (action === 'generate_f931') {
      return await generateF931(base44, user, client_id, period);
    }

    if (action === 'submit_f931') {
      return await submitF931(base44, user, client_id, period);
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error en automatización sueldos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Calcula liquidación de sueldos
 */
async function calculatePayroll(base44, user, client_id, period, employee_ids) {
  const employees = employee_ids 
    ? await Promise.all(employee_ids.map(id => base44.entities.Employee.get(id)))
    : await base44.entities.Employee.filter({ client_id, status: 'active' });

  const payslips = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalContributions = 0;

  for (const employee of employees) {
    if (!employee) continue;

    // Calcular sueldo con IA
    const calculation = await calculateSalaryWithAI(base44, employee, period);
    
    const payslip = await base44.entities.Payslip.create({
      client_id,
      client_name: (await base44.entities.Client.get(client_id))?.business_name,
      employee_id: employee.id,
      employee_name: employee.full_name,
      period,
      base_salary: calculation.baseSalary,
      overtime_hours: calculation.overtimeHours,
      overtime_amount: calculation.overtimeAmount,
      bonuses: calculation.bonuses,
      sac: calculation.sac,
      gross_salary: calculation.grossSalary,
      jubilacion: calculation.jubilacion,
      obra_social_employee: calculation.obraSocialEmployee,
      anssal: calculation.anssal,
      sindical: calculation.sindical,
      total_deductions: calculation.totalDeductions,
      net_salary: calculation.netSalary,
      employer_contributions: calculation.employerContributions,
      status: 'ai_generated',
      ai_notes: calculation.notes
    });

    payslips.push(payslip);
    totalGross += calculation.grossSalary;
    totalNet += calculation.netSalary;
    totalContributions += calculation.employerContributions;
  }

  return Response.json({
    success: true,
    period,
    employees_count: payslips.length,
    total_gross: totalGross,
    total_net: totalNet,
    total_contributions: totalContributions,
    payslips: payslips.map(p => ({
      id: p.id,
      employee_name: p.employee_name,
      gross_salary: p.gross_salary,
      net_salary: p.net_salary,
      deductions: p.total_deductions
    }))
  });
}

/**
 * Genera recibos de sueldo
 */
async function generatePayslips(base44, user, client_id, period) {
  const payslips = await base44.entities.Payslip.filter({
    client_id,
    period,
    status: 'ai_generated'
  });

  if (!payslips || payslips.length === 0) {
    return Response.json({ 
      error: 'Primero calculá los sueldos del período',
      requires_calculation: true
    }, { status: 400 });
  }

  // Actualizar estado
  await base44.entities.Payslip.updateMany(
    { client_id, period, status: 'ai_generated' },
    { $set: { status: 'approved' } }
  );

  return Response.json({
    success: true,
    message: `${payslips.length} recibos generados`,
    payslips_count: payslips.length,
    total_gross: payslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0),
    total_net: payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0)
  });
}

/**
 * Genera F.931
 */
async function generateF931(base44, user, client_id, period) {
  const payslips = await base44.entities.Payslip.filter({
    client_id,
    period,
    status: 'approved'
  });

  if (!payslips || payslips.length === 0) {
    return Response.json({ 
      error: 'No hay sueldos aprobados para este período',
      requires_approval: true
    }, { status: 400 });
  }

  // Calcular totales F.931
  const totalGross = payslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
  const totalJubilacion = payslips.reduce((sum, p) => sum + (p.jubilacion || 0), 0);
  const totalObraSocial = payslips.reduce((sum, p) => sum + ((p.obra_social_employee || 0) + (p.obra_social || 0)), 0);
  const totalAnssal = payslips.reduce((sum, p) => sum + ((p.anssal || 0) + (p.anssal || 0)), 0);
  const totalSindical = payslips.reduce((sum, p) => sum + (p.sindical || 0), 0);
  const totalContributions = payslips.reduce((sum, p) => sum + (p.employer_contributions || 0), 0);

  const taxFiling = await base44.entities.TaxFiling.create({
    client_id,
    client_name: (await base44.entities.Client.get(client_id))?.business_name,
    filing_type: 'sueldos',
    period,
    status: 'ai_generated',
    total_debit: totalGross,
    tax_payable: totalContributions,
    due_date: calculateF931DueDate(period),
    ai_notes: `Remuneraciones: $${totalGross.toLocaleString('es-AR')} | Empleados: ${payslips.length}`,
    ai_risk_flags: JSON.stringify({
      remuneraciones_totales: totalGross,
      empleados_count: payslips.length,
      jubilacion: totalJubilacion,
      obra_social: totalObraSocial,
      anssal: totalAnssal,
      sindical: totalSindical,
      contribuciones_patronales: totalContributions
    })
  });

  return Response.json({
    success: true,
    filing_id: taxFiling.id,
    period,
    remuneraciones_totales: totalGross,
    empleados_count: payslips.length,
    jubilacion: totalJubilacion,
    obra_social: totalObraSocial,
    anssal: totalAnssal,
    sindical: totalSindical,
    contribuciones_patronales: totalContributions,
    total_a_pagar: totalContributions,
    due_date: calculateF931DueDate(period)
  });
}

/**
 * Presenta F.931
 */
async function submitF931(base44, user, client_id, period) {
  const taxFilings = await base44.entities.TaxFiling.filter({
    client_id,
    filing_type: 'sueldos',
    period,
    status: 'review'
  });

  if (!taxFilings || taxFilings.length === 0) {
    return Response.json({ 
      error: 'No hay F.931 en estado de revisión',
      requires_review: true
    }, { status: 400 });
  }

  const filing = taxFilings[0];
  const submissionDate = new Date().toISOString().split('T')[0];
  
  await base44.entities.TaxFiling.update(filing.id, {
    status: 'submitted',
    submission_date: submissionDate,
    vep_number: `VEP-F931-${Date.now()}`
  });

  await base44.entities.AuditLog.create({
    user_id: user.id,
    user_email: user.email,
    action: 'approve',
    entity_type: 'TaxFiling',
    entity_id: filing.id,
    description: `Presentó F.931 ${period}`,
    client_id: client_id
  });

  return Response.json({
    success: true,
    message: 'F.931 presentada exitosamente',
    submission_date: submissionDate
  });
}

/**
 * Calcula sueldo con IA
 */
async function calculateSalaryWithAI(base44, employee, period) {
  const baseSalary = employee.base_salary || 0;
  const overtimeHours = employee.overtime_hours || 0;
  const overtimeAmount = overtimeHours * (baseSalary / 160) * 1.5;
  const bonuses = 0;
  const sac = baseSalary / 12; // Proporcional SAC
  
  const grossSalary = baseSalary + overtimeAmount + bonuses + sac;
  
  // Deducciones empleado
  const jubilacion = grossSalary * 0.11;
  const obraSocialEmployee = grossSalary * 0.03;
  const anssal = grossSalary * 0.015;
  const sindical = employee.afiliacion_sindical ? grossSalary * 0.02 : 0;
  const totalDeductions = jubilacion + obraSocialEmployee + anssal + sindical;
  
  const netSalary = grossSalary - totalDeductions;
  
  // Contribuciones patronales - varía según actividad y tamaño de empresa
  // Base: 27% pero puede ser 23% (servicios), 29% (comercio), o menos con desgravaciones
  const tasaPatronal = 0.27;
  const employerContributions = grossSalary * tasaPatronal;

  return {
    baseSalary,
    overtimeHours,
    overtimeAmount,
    bonuses,
    sac,
    grossSalary,
    jubilacion,
    obraSocialEmployee,
    anssal,
    sindical,
    totalDeductions,
    netSalary,
    employerContributions,
    notes: `Calculado automáticamente - ${new Date().toLocaleDateString('es-AR')} | Tasa patronal: ${tasaPatronal * 100}% (ajustar según actividad)`
  };
}

/**
 * Calcula vencimiento F.931 (día 10-15 según CUIT)
 */
function calculateF931DueDate(period) {
  const [month, year] = period.split('/').map(Number);
  const dueDate = new Date(year, month, 12);
  return dueDate.toISOString().split('T')[0];
}