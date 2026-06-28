import { base44 } from "@/api/base44Client";

/**
 * logAction — Registra automáticamente una acción de auditoría.
 * @param {string} action - Acción realizada (create, update, delete, approve, reject, ai_run, etc.)
 * @param {string} description - Descripción legible de la acción
 * @param {object} options - { entityType, entityId, clientId, clientName, oldData, newData, module }
 */
export async function logAction(action, description, options = {}) {
  try {
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_id: user?.id || "",
      user_email: user?.email || "sistema",
      action,
      description,
      entity_type: options.entityType || "",
      entity_id: options.entityId || "",
      client_id: options.clientId || "",
      ip_address: options.module || "",
      metadata: JSON.stringify({
        module: options.module || "",
        client_name: options.clientName || "",
        old_data: options.oldData || null,
        new_data: options.newData || null,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (e) {
    // Silently fail — never break user flow due to audit logging
    console.warn("[AuditLog] Failed to log:", e.message);
  }
}