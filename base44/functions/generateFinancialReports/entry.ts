import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * BALANCE GENERAL Y ESTADO DE RESULTADOS
 * Genera reportes financieros profesionales
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id, period_from, period_to, report_type } = await req.json();
    
    if (!client_id || !period_from || !period_to || !report_type) {
      return Response.json({ error: 'Parámetros requeridos: client_id, period_from, period_to, report_type' }, { status: 400 });
    }

    const client = await base44.entities.Client.get(client_id);
    
    // Obtener asientos contables del período
    const entries = await base44.entities.AccountEntry.filter({
      client_id,
      date: { $gte: period_from, $lte: period_to },
      status: 'posted'
    }, 'date', 2000);

    // Obtener plan de cuentas
    const accountPlan = await base44.entities.AccountPlan.filter({
      client_id,
      is_active: true
    }, 'code', 500);

    let reportData;
    
    if (report_type === 'balance_general') {
      reportData = await generateBalanceGeneral(entries, accountPlan, client, period_from, period_to);
    } else if (report_type === 'estado_resultados') {
      reportData = await generateEstadoResultados(entries, accountPlan, client, period_from, period_to);
    } else if (report_type === 'flujo_fondos') {
      reportData = await generateFlujoFondos(entries, accountPlan, client, period_from, period_to);
    } else {
      return Response.json({ error: 'Tipo de reporte inválido' }, { status: 400 });
    }

    // Log de auditoría
    await base44.entities.AuditLog.create({
      user_id: user.id,
      user_email: user.email,
      action: 'export',
      entity_type: 'FinancialReport',
      description: `Generó reporte ${report_type} para ${client.business_name}`,
      client_id,
      metadata: JSON.stringify({ report_type, period_from, period_to })
    });

    return Response.json({
      success: true,
      report_type,
      client: {
        business_name: client.business_name,
        cuit: client.cuit
      },
      period: { from: period_from, to: period_to },
      data: reportData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en reportes financieros:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Genera Balance General (Activo, Pasivo, Patrimonio)
 */
async function generateBalanceGeneral(entries, accountPlan, client, periodFrom, periodTo) {
  // Clasificar cuentas por tipo
  const activo = { corriente: [], noCorriente: [], total: 0 };
  const pasivo = { corriente: [], noCorriente: [], total: 0 };
  const patrimonio = { items: [], total: 0 };

  // Calcular saldos por cuenta
  const saldos = {};
  entries.forEach(entry => {
    if (entry.account_debit) {
      saldos[entry.account_debit] = (saldos[entry.account_debit] || 0) + entry.amount;
    }
    if (entry.account_credit) {
      saldos[entry.account_credit] = (saldos[entry.account_credit] || 0) - entry.amount;
    }
  });

  // Clasificar cada cuenta
  accountPlan.forEach(cuenta => {
    const saldo = saldos[cuenta.code] || 0;
    const item = {
      code: cuenta.code,
      name: cuenta.name,
      saldo: Math.abs(saldo)
    };

    if (cuenta.type === 'activo') {
      if (cuenta.subtype === 'corriente') {
        activo.corriente.push(item);
      } else {
        activo.noCorriente.push(item);
      }
      activo.total += saldo;
    } else if (cuenta.type === 'pasivo') {
      if (cuenta.subtype === 'corriente') {
        pasivo.corriente.push(item);
      } else {
        pasivo.noCorriente.push(item);
      }
      pasivo.total += saldo;
    } else if (cuenta.type === 'patrimonio') {
      patrimonio.items.push(item);
      patrimonio.total += saldo;
    }
  });

  return {
    activo,
    pasivo,
    patrimonio,
    totalActivo: activo.total,
    totalPasivo: pasivo.total,
    totalPatrimonio: patrimonio.total,
    diferencia: activo.total - (pasivo.total + patrimonio.total)
  };
}

/**
 * Genera Estado de Resultados (Pérdidas y Ganancias)
 */
async function generateEstadoResultados(entries, accountPlan, client, periodFrom, periodTo) {
  const ingresos = [];
  const costos = [];
  const gastos = [];
  const otrosResultados = [];

  let totalIngresos = 0;
  let totalCostos = 0;
  let totalGastos = 0;

  // Clasificar cuentas de resultado
  accountPlan.forEach(cuenta => {
    if (cuenta.type === 'ingreso' || cuenta.type === 'resultado') {
      const saldo = calcularSaldo(entries, cuenta.code);
      if (saldo !== 0) {
        const item = {
          code: cuenta.code,
          name: cuenta.name,
          monto: Math.abs(saldo)
        };
        
        if (cuenta.name.toLowerCase().includes('venta') || cuenta.name.toLowerCase().includes('ingreso')) {
          ingresos.push(item);
          totalIngresos += saldo;
        } else if (cuenta.name.toLowerCase().includes('costo')) {
          costos.push(item);
          totalCostos += saldo;
        } else {
          gastos.push(item);
          totalGastos += saldo;
        }
      }
    }
  });

  const resultadoBruto = totalIngresos - totalCostos;
  const resultadoNeto = resultadoBruto - totalGastos;

  return {
    ingresos,
    costos,
    gastos,
    otrosResultados,
    totalIngresos,
    totalCostos,
    totalGastos,
    resultadoBruto,
    resultadoNeto,
    margenBruto: totalIngresos > 0 ? ((resultadoBruto / totalIngresos) * 100).toFixed(2) : 0,
    margenNeto: totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(2) : 0
  };
}

/**
 * Genera Flujo de Fondos (Cash Flow)
 */
async function generateFlujoFondos(entries, accountPlan, client, periodFrom, periodTo) {
  // Obtener movimientos de tesorería
  const treasuryTransactions = await base44.entities.TreasuryTransaction.filter({
    client_id: client.id,
    date: { $gte: periodFrom, $lte: periodTo }
  }, 'date', 1000);

  const actividades = {
    operativas: { ingresos: [], egresos: [], neto: 0 },
    inversion: { ingresos: [], egresos: [], neto: 0 },
    financiacion: { ingresos: [], egresos: [], neto: 0 }
  };

  treasuryTransactions.forEach(tx => {
    const item = {
      fecha: tx.date,
      descripcion: tx.description || tx.category,
      monto: tx.amount
    };

    if (tx.type === 'ingreso') {
      if (tx.category === 'cobro_cliente') {
        actividades.operativas.ingresos.push(item);
        actividades.operativas.neto += tx.amount;
      } else if (tx.category === 'banco') {
        actividades.financiacion.ingresos.push(item);
        actividades.financiacion.neto += tx.amount;
      } else {
        actividades.inversion.ingresos.push(item);
        actividades.inversion.neto += tx.amount;
      }
    } else if (tx.type === 'egreso') {
      if (['pago_proveedor', 'sueldo', 'impuesto'].includes(tx.category)) {
        actividades.operativas.egresos.push(item);
        actividades.operativas.neto -= tx.amount;
      } else if (tx.category === 'alquiler' || tx.category === 'servicio') {
        actividades.operativas.egresos.push(item);
        actividades.operativas.neto -= tx.amount;
      } else {
        actividades.inversion.egresos.push(item);
        actividades.inversion.neto -= tx.amount;
      }
    }
  });

  const saldoInicial = 0; // Obtener de período anterior
  const saldoFinal = actividades.operativas.neto + actividades.inversion.neto + actividades.financiacion.neto;

  return {
    actividades,
    saldoInicial,
    saldoFinal,
    variacion: saldoFinal - saldoInicial
  };
}

/**
 * Calcula saldo de una cuenta
 */
function calcularSaldo(entries, accountCode) {
  let saldo = 0;
  entries.forEach(entry => {
    if (entry.account_debit === accountCode) {
      saldo += entry.amount;
    }
    if (entry.account_credit === accountCode) {
      saldo -= entry.amount;
    }
  });
  return saldo;
}