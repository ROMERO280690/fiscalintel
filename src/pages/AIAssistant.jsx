import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import ReactMarkdown from "react-markdown";

const quickActions = [
  { label: "📅 Vencimientos del mes", prompt: "Como contador experto en ARCA, indicame los vencimientos impositivos clave para el mes actual según el calendario fiscal vigente de ARCA (ex AFIP). Incluí IVA por terminación de CUIT, Monotributo, Autónomos, F931, anticipos de Ganancias y IIBB. Sé específico con fechas." },
  { label: "📊 Posición IVA mensual", prompt: "Explicame paso a paso cómo determinar la posición mensual de IVA de un Responsable Inscripto en Argentina: cálculo de débito fiscal, crédito fiscal, saldo técnico, saldo de libre disponibilidad y saldo de IVA a pagar o a favor. Incluí los artículos de la Ley 23.349 que correspondan." },
  { label: "🏢 Recategorización Monotributo", prompt: "¿Cuáles son los parámetros vigentes para la recategorización cuatrimestral del Monotributo en Argentina? Indicame los parámetros de cada categoría (facturación, alquileres, energía eléctrica, empleados), las fechas de recategorización y qué pasa si un monotributista supera los límites de la categoría H para servicios o K para venta de cosas muebles." },
  { label: "⚖️ RI vs Monotributo", prompt: "Analizá en detalle cuándo conviene pasar de Monotributo a Responsable Inscripto en Argentina. Considerá: límites de facturación vigentes, carga fiscal comparada (IVA + Ganancias vs. cuota fija), impacto en clientes (discriminación de IVA en facturas A), trámite ante ARCA y aspectos prácticos para el contador." },
  { label: "📝 Convenio Multilateral CM05", prompt: "Explicame el régimen de Convenio Multilateral para Ingresos Brutos en Argentina: cuándo aplica, diferencia entre CM03 y CM05, cómo se calculan los coeficientes unificados (ingresos y gastos), qué jurisdicciones corresponden, y cómo se determina la base imponible por provincia." },
  { label: "💼 F931 y cargas sociales", prompt: "Explicame la composición del F931 (SICOSS) en Argentina: alícuotas vigentes de contribuciones patronales (23% según decreto), retenciones del trabajador (jubilación 11%, obra social 3%, ANSSAL 0,5%, contribución sindical), diferencia entre el régimen general y el régimen de PyMEs con reducción, y cómo se presenta ante ARCA." },
  { label: "🔍 Retenciones y percepciones", prompt: "Explicame el sistema de retenciones y percepciones impositivas en Argentina: diferencias entre retenciones de IVA (RG 2854 ARCA), retenciones de Ganancias (RG 830), percepciones de IIBB y los distintos regímenes especiales. ¿Cómo se computan en la DDJJ del período?" },
  { label: "📋 Bienes Personales 2024", prompt: "Cuáles son las novedades del impuesto a Bienes Personales para el período fiscal 2024 en Argentina? Incluí: alícuotas vigentes (tanto para bienes en el país como en el exterior), mínimo no imponible actualizado, valuación de inmuebles (VIR o valor fiscal), acciones y participaciones sociales, y el régimen de Bienes Personales para no residentes (RFCE)." },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput("");
    setLoading(true);

    // Construir historial de conversación para contexto
    const historial = currentMessages.slice(-8).map(m =>
      `[${m.role === "user" ? "CONTADOR" : "ASISTENTE"}]: ${m.content}`
    ).join("\n\n");

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador público argentino matriculado con especialización en derecho tributario y auditoría. Tenés más de 20 años de experiencia en estudios contables y asesoramiento a empresas en Argentina.

Tu conocimiento abarca:
- ARCA (ex AFIP): RG vigentes, sistemas SIAP, CITI, SICOSS, SICORE, RUCAP, SIRADIG, Padrones IVA
- Impuestos nacionales: IVA (Ley 23.349), Ganancias (Ley 20.628 y reforma Ley 27.430), Bienes Personales (Ley 23.966), Monotributo (Ley 24.977), Autónomos
- Seguridad Social: Ley 24.241 (SIJP), Ley 23.660/23.661 (obras sociales), F931/SICOSS, alícuotas patronales
- Ingresos Brutos y Convenio Multilateral: regímenes locales y CM05
- Normas contables profesionales: RT FACPCE, NIC/NIIF aplicables en Argentina
- Legislación laboral: LCT (Ley 20.744), convenios colectivos, liquidación de sueldos
- Derecho societario: Ley 19.550 (Ley General de Sociedades), actas, libros obligatorios
- Procedimiento tributario: Ley 11.683, recurso de apelación, TFN, sanciones
- Normativa vigente 2024/2025: Ley Bases, RIGI, blanqueo (Ley 27.743), moratoria, Ganancias 4ª categoría restitución

Respondé SIEMPRE con precisión técnica contable. Citá artículos de ley, resoluciones generales y resoluciones normativas cuando sea relevante. Usá formato Markdown con secciones claras, tablas cuando corresponda, y notas de advertencia (⚠️) para riesgos fiscales. Si la consulta involucra un cálculo, mostrá los números paso a paso. Si hay jurisprudencia relevante del Tribunal Fiscal de la Nación (TFN) o la CSJN, mencionala.

Historial de la consulta:
${historial}

Respondé la última consulta del CONTADOR manteniendo el contexto de la conversación anterior.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error al procesar la consulta. Por favor, intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <PageHeader title="Asistente IA Tributario" subtitle="Consultas sobre legislación y estrategia fiscal argentina" />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C7D9] to-[#00A8BD] flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A2E] mb-1">Asistente Contable IA</h3>
            <p className="text-[13px] text-slate-500 text-center max-w-sm mb-1">
              Especializado en normativa ARCA · IVA · Ganancias · IIBB · Sueldos · Sociedades
            </p>
            <p className="text-[11px] text-slate-400 text-center mb-6">
              ⚠️ Las respuestas son orientativas. Siempre verificá con la normativa vigente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#00C7D9] hover:bg-[#E0F7FA]/30 transition-all text-[12px] text-slate-600 hover:text-[#1A1A2E]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-[#1A1A2E] text-white"
                : "bg-white border border-slate-100 shadow-sm"
            }`}>
              {msg.role === "user" ? (
                <p className="text-[13px]">{msg.content}</p>
              ) : (
                <ReactMarkdown className="text-[13px] prose prose-sm max-w-none prose-headings:text-[#1A1A2E] prose-p:text-slate-700 prose-li:text-slate-700">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00C7D9]" />
              <span className="text-[13px] text-slate-500">Analizando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white rounded-xl p-3 mt-auto">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Consultá sobre normativa fiscal, vencimientos, estrategias..."
            className="flex-1 px-4 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20 focus:border-[#00C7D9]"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white rounded-xl px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}