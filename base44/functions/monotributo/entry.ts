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
    servicios_capital: { A: 7300, B: 10500, C: 14800, D: 19000, E: 24500, F: 30000, G: 36500, H: 43000, I: 51000, J: 60000, K: 70000, L: 81000, M: 93000, N: 106000 },
    servicios_interior: { A: 6600, B: 9500, C: 13300, D: 17100, E: 22000, F: 27000, G: 32800, H: 38700, I: 45900, J: 54000, K: 63000, L: 72900, M: 83700, N: 95400 },
    ventas: { A: 5900, B: 8500, C: 11900, D: 15300, E: 19700, F: 24100, G: 29300, H: 35500, I: 42000, J: 49500, K: 58000, L: 67500, M: 78000, N: 89500 }
  };

  const client = await base44.entities.Client.get(client_id);
  const key = activity_type === 'venta_cosas_muebles' ? 'ventas' : 
              location === 'capital_federal' ? 'servicios_capital' : 'servicios_interior';
  
  const monthlyFee = cuotas2026[key]?.[category] || 0;
  const ivaIncluded = monthlyFee * 0.21;
  const ipIncluded = monthlyFee * 0.05;
  const socialSecurity = monthlyFee * 0.30;

  const monotributo = await base44.entities.Monotributo.create({
    company_id: client?.company_id,
    client_id,
    client_name: client?.business_name,
    period,
    category,
    activity_type,
    location,
    monthly_fee: monthlyFee,
    iva_included: ivaIncluded,
    ip_included: ipIncluded,
    social_security: socialSecurity,
    total_paid: monthlyFee,
    status: 'pending'
  });

  return Response.json({
    success: true,
    monotributo_id: monotributo.id,
    period,
    category,
    monthly_fee: monthlyFee,
    iva_included: ivaIncluded,
    ip_included: ipIncluded,
    social_security: socialSecurity,
    total: monthlyFee,
    due_date: calculateDueDate(period),
    message: `Cuota categoría ${category}: $${monthlyFee.toLocaleString('es-AR')}`
  });
}

/**
 * Genera pagos de Monotributo del período
 */
async function generatePayments(base44, user, client_id, period) {
  const client = await base44.entities.Client.get(client_id);
  const category = client?.tax_category || 'A';
  const activity_type = 'servicios';
  const location = 'interior';

  const result = await calculateFee(base44, user, client_id, period, category, activity_type, location);
  
  return Response.json(result);
}

/**
 * Verifica si corresponde recategorización
 */
async function checkRecategorization(base44, user, client_id) {
  const client = await base44.entities.Client.get(client_id);
  
  // Límites de categorías 2026 (aproximados)
  const limites2026 = {
    A: 1200000, B: 2400000, C: 3600000, D: 4800000, E: 6000000,
    F: 7200000, G: 8400000, H: 9600000, I: 10800000, J: 12000000,
    K: 13200000, L: 14400000, M: 15600000, N: 16800000
  };

  const currentCategory = client?.tax_category || 'A';
  const annualIncome = 0; // Calcular de facturas del año

  const currentLimit = limites2026[currentCategory];
  const nextCategory = getNextCategory(currentCategory);
  const nextLimit = limites2026[nextCategory];

  const needsRecategorization = annualIncome > currentLimit;
  const canUpgrade = annualIncome > currentLimit && annualIncome <= nextLimit;

  return Response.json({
    success: true,
    current_category: currentCategory,
    current_limit: currentLimit,
    annual_income: annualIncome,
    needs_recategorization: needsRecategorization,
    next_category: nextCategory,
    next_limit: nextLimit,
    can_upgrade: canUpgrade,
    message: needsRecategorization 
      ? `⚠️ Corresponde recategorización a ${nextCategory}`
      : '✅ No corresponde recategorización'
  });
}

function getNextCategory(current) {
  const categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const index = categories.indexOf(current);
  return index < categories.length - 1 ? categories[index + 1] : 'N';
}

function calculateDueDate(period) {
  const [month, year] = period.split('/').map(Number);
  const dueDate = new Date(year, month, 17);
  return dueDate.toISOString().split('T')[0];
}