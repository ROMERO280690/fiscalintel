import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import ReactMarkdown from "react-markdown";

const quickActions = [
  { label: "Análisis de riesgo fiscal", prompt: "Analizá el riesgo fiscal de mis clientes y generá un informe con recomendaciones." },
  { label: "Calendario de vencimientos", prompt: "Generá el calendario de vencimientos impositivos del mes actual para Argentina." },
  { label: "Comparar períodos IVA", prompt: "Explicame cómo comparar los períodos de IVA para detectar inconsistencias." },
  { label: "Novedades impositivas", prompt: "¿Cuáles son las últimas novedades impositivas de Argentina que debería conocer?" },
  { label: "Optimización tributaria", prompt: "Dame estrategias de optimización tributaria legales para PyMEs argentinas." },
  { label: "Recategorización Monotributo", prompt: "¿Cuáles son los parámetros actuales para la recategorización del Monotributo?" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un asistente contable experto en legislación tributaria argentina. Tu especialidad incluye: IVA, Ingresos Brutos, Monotributo, Convenio Multilateral, Ganancias, Bienes Personales, ARCA (ex AFIP), y toda la normativa impositiva argentina vigente.

Respondé de forma clara, precisa y profesional. Usá lenguaje técnico contable cuando corresponda. Si no estás seguro de algo, indicalo.

Consulta del contador: ${text}`,
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
            <h3 className="text-base font-bold text-[#1A1A2E] mb-1">Asistente IA Tributario</h3>
            <p className="text-[13px] text-slate-500 text-center max-w-sm mb-6">
              Consultá sobre normativa fiscal argentina, estrategias tributarias, vencimientos y más.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
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