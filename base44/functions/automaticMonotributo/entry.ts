import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CÁLCULO DE MONOTRIBUTO - CUOTAS Y RECATEGORIZACIÓN
 * Calcula cuota mensual según categoría, actividad y ubicación
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, period, category, activity_type, location } = await req.json();

    if (action === 'calculate_fee') {
      return await calculateFee(base44, user, client_id, period, category, activity_type, location);
    }

    if (action === 'generate_payments') {
      return await generatePayments(base44, user, client_id, period);
    }

    if (action === 'check_recategorization') {
      return await checkRecategorization(base44, user, client_id);
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error en Monotributo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Calcula cuota de Monotributo según categoría 2026
 */
async function calculateFee(base44, user, client_id, period, category, activity_type, location) {
  // Cuotas de Monotributo 2026 (valores aproximados - actualizar según AFIP)
  const cuotas2026 = {
    // Servicios - Capital Federal
    servicios_capital: { A: 7300, B: 10500, C: 14800, D: 19000, E: 24500, F: 30000, G: 36500, H: 43000, I: 51000, J: 60000, K: 70000, L: 81000, M: 93000, N: 106000 },
    // Servicios - Interior
    servicios_interior: { A: 6600, B: 9500, C: 13300, D: 17100, E: 22000, F: 27000, G: 32800, H: 38700, I: 45900, J: 54000, K: 63000, L: 72900, M: 83700, N: 95400 },
    // Ventas - Todo el país
    ventas: { A: 5900, B: 8500, C: 11900, D: 15300, E: 19700, F: 24100, G: 29300, H: 34500, I: 40900, J: 48100, K: 56100, L: 64800, M: 74400, N: 84700 },
  };

  // Determinar tabla de cuotas
  let tablaCuotas;
  if (activity_type === 'venta_cosas_muebles') {
    tablaCuotas = cuotas2026.ventas;
  } else if (activity_type === 'servicios') {
    tablaCuotas = location === 'capital_federal' ? cuotas2026.servicios_capital : cuotas2026.servicios_interior;
  } else {
    // Actividades mixtas - usar la que genere mayor cuota
    tablaCuotas = location === 'capital_federal' ? cuotas2026.servicios_capital : cuotas2026.servicios_interior;
  }

  const monthlyFee = tablaCuotas[category] || 0;

  // Desglose de la cuota (valores aproximados)
  const ivaIncluded = monthlyFee * 0.21; // 21% IVA
  const ipIncluded = monthlyFee * 0.05; // 5% Impuestos internos (si corresponde)
  const socialSecurity = monthlyFee * 0.30; // 30% aproximado para autónomos
  const totalPaid = monthlyFee;

  // Guardar cálculo
  const monotributo = await base44.entities.Monotributo.create({
    company_id: (await base44.entities.Client.get(client_id))?.company_id,
    client_id,
    client_name: (await base44.entities.Client.get(client_id))?.business_name,
    period,
    category,
    activity_type,
    location,
    monthly_fee: monthlyFee,
    iva_included: ivaIncluded,
    ip_included: ipIncluded,
    social_security: socialSecurity,
    total_paid: totalPaid,
    status: 'pending'
  });

  return Response.json({
    success: true,
    record_id: monotributo.id,
    category,
    activity_type,
    location,
    monthly_fee: monthlyFee,
    desglose: {
      iva: ivaIncluded,
      impuestos_internos: ipIncluded,
      aportes_sociales: socialSecurity,
      total: totalPaid
    },
    vencimiento: calculateDueDate(period),
    message: `Categoría ${category} - Cuota $${monthlyFee.toLocaleString('es-AR')}`
  });
}

/**
 * Genera pagos de Monotributo para todo el año
 */
async function generatePayments(base44, user, client_id, period) {
  const client = await base44.entities.Client.get(client_id);
  const [year, month] = period.split('/').map(Number);
  
  const payments = [];
  
  // Generar 12 meses
  for (let m = 0; m < 12; m++) {
    const monthNum = ((month - 1 + m) % 12) + 1;
    const yearNum = year + Math.floor((month - 1 + m) / 12);
    const periodStr = `${String(monthNum).padStart(2, '0')}/${yearNum}`;
    
    // Verificar si ya existe
    const existing = await base44.entities.Monotributo.filter({
      client_id,
      period: periodStr
    });
    
    if (existing && existing.length > 0) continue;
    
    const payment = await base44.entities.Monotributo.create({
      company_id: client.company_id,
      client_id,
      client_name: client.business_name,
      period: periodStr,
      category: client.monotributo_category || 'A',
      activity_type: 'servicios',
      location: 'interior',
      monthly_fee: 0, // Se calcula después
      status: 'pending'
    });
    
    payments.push(payment);
  }

  return Response.json({
    success: true,
    payments_generated: payments.length,
    message: `${payments.length} cuotas de Monotributo generadas`
  });
}

/**
 * Verifica si corresponde recategorización (31 de diciembre)
 */
async function checkRecategorization(base44, user, client_id) {
  const client = await base44.entities.Client.get(client_id);
  
  // Obtener todos los monotributos del año
  const currentYear = new Date().getFullYear();
  const monotributos = await base44.entities.Monotributo.filter({
    client_id,
    period: { $regex: `/${currentYear}$` }
  });

  // Calcular ingresos anuales
  const annualIncome = monotributos.reduce((sum, m) => sum + (m.monthly_fee || 0) * 12, 0);
  
  // Parámetros de recategorización 2026 (aproximados)
  const limites2026 = {
    A: 1200000,
    B: 2400000,
    C: 4800000,
    D: 7200000,
    E: 10800000,
    F: 15600000,
    G: 20400000,
    H: 25200000,
    I: 30000000,
    J: 34800000,
    K: 39600000,
    L: 44400000,
    M: 49200000,
    N: 54000000
  };

  const currentCategory = client.monotributo_category || 'A';
  const currentLimit = limites2026[currentCategory];
  const nextCategory = String.fromCharCode(currentCategory.charCodeAt(0) + 1);
  const nextLimit = limites2026[nextCategory];

  let needsRecategorization = false;
  let newCategory = currentCategory;
  let message = 'No corresponde recategorización';

  // Si supera el límite de su categoría, debe recategorizar
  if (annualIncome > currentLimit) {
    needsRecategorization = true;
    newCategory = nextCategory;
    message = `ALERTA: Ingresos ($${annualIncome.toLocaleString()}) superan límite de categoría ${currentCategory}. Corresponde categoría ${newCategory}.`;
  }

  return Response.json({
    success: true,
    client_id,
    current_category: currentCategory,
    annual_income: annualIncome,
    current_limit: currentLimit,
    needs_recategorization: needsRecategorization,
    new_category: newCategory,
    message,
    recategorization_deadline: `${currentYear}-12-31`
  });
}

/**
 * Calcula vencimiento de Monotributo (día 17 según CUIT)
 */
function calculateDueDate(period) {
  const [month, year] = period.split('/').map(Number);
  const dueDate = new Date(year, month, 17);
  return dueDate.toISOString().split('T')[0];
}