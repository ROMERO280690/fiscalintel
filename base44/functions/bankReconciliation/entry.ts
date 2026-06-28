import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CONCILIACIÓN BANCARIA AUTOMÁTICA
 * Importa extractos bancarios y concilia automáticamente con IA
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, client_id, file_url, bank_name } = await req.json();

    if (action === 'import_extract') {
      // Importar extracto bancario desde archivo CSV/Excel
      if (!file_url || !client_id) {
        return Response.json({ error: 'file_url y client_id requeridos' }, { status: 400 });
      }

      const extractedData = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            movimientos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fecha: { type: 'string' },
                  descripcion: { type: 'string' },
                  monto: { type: 'number' },
                  tipo: { type: 'string' },
                  referencia: { type: 'string' }
                },
                required: ['fecha', 'descripcion', 'monto']
              }
            }
          }
        }
      });

      if (extractedData.status === 'error') {
        return Response.json({ error: extractedData.details }, { status: 400 });
      }

      const movimientos = extractedData.output?.movimientos || [];
      
      // Crear movimientos en entidad TreasuryTransaction
      const transactionsToCreate = movimientos.map(mov => ({
        client_id,
        client_name: '',
        date: mov.fecha,
        type: mov.tipo === 'ingreso' || mov.monto > 0 ? 'ingreso' : 'egreso',
        category: 'banco',
        description: mov.descripcion,
        amount: Math.abs(mov.monto),
        account: bank_name || 'banco_otro',
        reference: mov.referencia || '',
        reconciled: false,
        period: mov.fecha.substring(0, 7) // MM/YYYY
      }));

      if (transactionsToCreate.length > 0) {
        await base44.entities.TreasuryTransaction.bulkCreate(transactionsToCreate);
      }

      // Log de auditoría
      await base44.entities.AuditLog.create({
        user_id: user.id,
        user_email: user.email,
        action: 'import',
        entity_type: 'TreasuryTransaction',
        description: `Importó ${transactionsToCreate.length} movimientos bancarios`,
        client_id,
        metadata: JSON.stringify({ count: transactionsToCreate.length, bank: bank_name })
      });

      return Response.json({
        success: true,
        imported_count: transactionsToCreate.length,
        message: `${transactionsToCreate.length} movimientos importados`
      });
    }

    if (action === 'auto_reconcile') {
      // Conciliación automática con IA
      if (!client_id) {
        return Response.json({ error: 'client_id requerido' }, { status: 400 });
      }

      // Obtener movimientos no conciliados
      const transactions = await base44.entities.TreasuryTransaction.filter({
        client_id,
        reconciled: false
      }, 'date', 500);

      // Obtener comprobantes aprobados
      const documents = await base44.entities.Document.filter({
        client_id,
        status: 'approved'
      }, 'date', 500);

      // Obtener asientos contables
      const entries = await base44.entities.AccountEntry.filter({
        client_id,
        status: 'posted'
      }, 'date', 500);

      if (transactions.length === 0) {
        return Response.json({
          success: true,
          message: 'No hay movimientos para conciliar',
          matches: [],
          unmatched: []
        });
      }

      // Usar IA para conciliar
      const reconciliationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Sos un contador argentino experto en conciliación bancaria. Analizá estos movimientos bancarios y confrontalos con comprobantes registrados.

MOVIMIENTOS BANCARIOS (extracto bancario):
${JSON.stringify(transactions.map(t => ({
  id: t.id,
  fecha: t.date,
  descripcion: t.description,
  monto: t.amount,
  tipo: t.type,
  referencia: t.reference
})), null, 2)}

COMPROBANTES REGISTRADOS:
${JSON.stringify(documents.map(d => ({
  id: d.id,
  fecha: d.date,
  tipo: d.doc_type,
  monto: d.amount,
  emisor: d.issuer_name,
  numero: d.invoice_number
})), null, 2)}

ASIENTOS CONTABLES:
${JSON.stringify(entries.slice(0, 100).map(e => ({
  id: e.id,
  fecha: e.date,
  descripcion: e.description,
  monto: e.amount,
  tipo: e.entry_type,
  cuenta_debito: e.account_debit,
  cuenta_credito: e.account_credit
})), null, 2)}

IDENTIFICÁ:
1. MOVIMIENTOS CONCILIADOS: movimientos bancarios que coinciden con comprobantes/asientos (misma fecha ±3 días, mismo monto ±1%, misma descripción)
2. MOVIMIENTOS NO CONCILIADOS: movimientos sin comprobante asociado
3. DIFERENCIAS: discrepancias entre monto bancario y monto contable

Respondé en JSON con:
{
  "matches": [{bank_transaction_id, document_id, confidence (0-1), explanation}],
  "unmatched": [{bank_transaction_id, reason, suggested_action}],
  "discrepancies": [{bank_transaction_id, document_id, bank_amount, book_amount, difference}]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bank_transaction_id: { type: 'string' },
                  document_id: { type: 'string' },
                  confidence: { type: 'number' },
                  explanation: { type: 'string' }
                }
              }
            },
            unmatched: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bank_transaction_id: { type: 'string' },
                  reason: { type: 'string' },
                  suggested_action: { type: 'string' }
                }
              }
            },
            discrepancies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bank_transaction_id: { type: 'string' },
                  document_id: { type: 'string' },
                  bank_amount: { type: 'number' },
                  book_amount: { type: 'number' },
                  difference: { type: 'number' }
                }
              }
            }
          }
        }
      });

      const matches = reconciliationResult.matches || [];
      const highConfidenceMatches = matches.filter(m => m.confidence > 0.85);

      // Marcar como conciliados los matches con alta confianza
      for (const match of highConfidenceMatches) {
        await base44.entities.TreasuryTransaction.update(match.bank_transaction_id, {
          reconciled: true
        });
      }

      // Log de auditoría
      await base44.entities.AuditLog.create({
        user_id: user.id,
        user_email: user.email,
        action: 'ai_run',
        entity_type: 'TreasuryTransaction',
        description: `IA concilió ${highConfidenceMatches.length} movimientos bancarios`,
        client_id,
        metadata: JSON.stringify({
          total_transactions: transactions.length,
          matches: matches.length,
          high_confidence: highConfidenceMatches.length
        })
      });

      return Response.json({
        success: true,
        total_transactions: transactions.length,
        matches_count: matches.length,
        high_confidence_matches: highConfidenceMatches.length,
        unmatched_count: (reconciliationResult.unmatched || []).length,
        discrepancies: reconciliationResult.discrepancies || [],
        reconciled_ids: highConfidenceMatches.map(m => m.bank_transaction_id),
        message: `${highConfidenceMatches.length} movimientos conciliados automáticamente`
      });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    console.error('Error en conciliación bancaria:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});