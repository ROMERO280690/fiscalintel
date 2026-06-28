import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const OBLIGATION_LABELS = {
  iva: "IVA", iibb: "Ingresos Brutos", monotributo: "Monotributo",
  autonomos: "Autónomos", ganancias: "Ganancias", bienes_personales: "Bienes Personales",
  sueldos: "Sueldos", f931: "F931", sociedades: "Sociedades",
  municipal: "Municipal", otro: "Obligación Fiscal"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (service role) and manual (admin) invocations
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === "admin" || user?.role === "super_admin";
    } catch {
      // Called from automation without user token — use service role
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all pending deadlines
    const deadlines = await base44.asServiceRole.entities.TaxDeadline.filter({ status: "pending" }, "due_date", 500);

    const results = { sent: 0, skipped: 0, errors: 0, notifications: [] };

    for (const dl of deadlines) {
      const dueDate = new Date(dl.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      // Alert thresholds: 15, 7, 3, 1 days before AND overdue (day 0/-1)
      const shouldAlert = [15, 7, 3, 1, 0, -1].includes(daysUntil);
      if (!shouldAlert) { results.skipped++; continue; }

      // Avoid duplicate alerts on the same day
      if (dl.alert_sent && daysUntil > 0) {
        // Check if we already sent today — we re-use alert_sent as a simple flag
        // For production, you'd store the last alert date. Here we skip if already flagged.
        results.skipped++;
        continue;
      }

      const obligationType = OBLIGATION_LABELS[dl.obligation_type] || dl.obligation_type;
      const urgencyLabel = daysUntil < 0
        ? `⛔ VENCIDO hace ${Math.abs(daysUntil)} día(s)`
        : daysUntil === 0
        ? "🚨 VENCE HOY"
        : daysUntil === 1
        ? "⚠️ Vence MAÑANA"
        : `⏰ Vence en ${daysUntil} días`;

      const subject = `${urgencyLabel} — ${obligationType} · ${dl.client_name}`;
      const amountLine = dl.amount_estimated > 0
        ? `\n• Monto estimado: $${Number(dl.amount_estimated).toLocaleString("es-AR")}`
        : "";

      const emailBody = `Estimado/a,

${urgencyLabel}

Detalle de la obligación:
• Cliente: ${dl.client_name}
• Tipo: ${obligationType}
• Período: ${dl.period || "N/D"}
• Vencimiento: ${dl.due_date}${amountLine}
• Descripción: ${dl.description || "—"}

Por favor tomá las acciones necesarias antes de la fecha límite.

—
ContaIA · Sistema de Alertas Fiscales
Este es un mensaje automático.`;

      // Fetch client to get their email
      let clientEmail = null;
      try {
        if (dl.client_id) {
          const clients = await base44.asServiceRole.entities.Client.filter({ id: dl.client_id }, "-created_date", 1);
          clientEmail = clients[0]?.email || null;
        }
      } catch { /* ignore */ }

      // Fetch all admin/contador users to notify
      let staffUsers = [];
      try {
        staffUsers = await base44.asServiceRole.entities.User.list("-created_date", 50);
        staffUsers = staffUsers.filter(u => u.role === "admin" || u.role === "contador" || u.role === "super_admin" || u.role === "estudio_contable");
      } catch { /* ignore */ }

      const recipients = [...new Set([
        ...staffUsers.map(u => u.email).filter(Boolean),
        ...(clientEmail ? [clientEmail] : [])
      ])];

      let emailsSent = 0;
      for (const email of recipients) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: "ContaIA · Alertas Fiscales",
            to: email,
            subject,
            body: emailBody,
          });
          emailsSent++;
        } catch (e) {
          console.error(`Failed to send email to ${email}:`, e.message);
          results.errors++;
        }
      }

      // Create in-app notification record
      try {
        for (const u of staffUsers) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_id: u.id,
            recipient_email: u.email,
            type: "vencimiento",
            title: subject,
            message: `${obligationType} · ${dl.client_name} · Vence: ${dl.due_date}`,
            client_id: dl.client_id,
            client_name: dl.client_name,
            priority: daysUntil <= 1 ? "critical" : daysUntil <= 3 ? "high" : daysUntil <= 7 ? "medium" : "low",
            read: false,
            email_sent: emailsSent > 0,
            link: "/tax-calendar",
          });
        }
      } catch (e) {
        console.error("Failed to create notification:", e.message);
      }

      // Mark alert as sent
      try {
        await base44.asServiceRole.entities.TaxDeadline.update(dl.id, { alert_sent: true });
      } catch { /* ignore */ }

      results.sent++;
      results.notifications.push({ client: dl.client_name, obligation: obligationType, daysUntil, recipients: recipients.length });
    }

    return Response.json({
      success: true,
      processed: deadlines.length,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("checkTaxDeadlines error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});