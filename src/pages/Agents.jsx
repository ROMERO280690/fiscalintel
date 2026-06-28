import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Send, Loader2, Sparkles, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import ReactMarkdown from "react-markdown";

const AGENTS = [
  { id: "agente_iva", name: "Agente IVA", description: "Débito/crédito fiscal, DDJJ IVA, comprobantes", icon: "💼" },
  { id: "agente_laboral", name: "Agente Laboral", description: "Sueldos, F931, ART, convenios colectivos", icon: "👥" },
  { id: "agente_arca", name: "Agente ARCA", description: "Trámites ARCA, VEP, padrones, servicios web", icon: "🏛️" },
  { id: "agente_normativo", name: "Agente Normativo", description: "RG ARCA, leyes, jurisprudencia tributaria", icon: "📋" },
  { id: "agente_contable", name: "Agente Contable", description: "Asientos, balances, plan de cuentas, FACPCE", icon: "📒" },
  { id: "agente_auditor", name: "Agente Auditor", description: "Auditoría fiscal, riesgos, inconsistencias", icon: "🔍" },
  { id: "agente_documental", name: "Agente Documental", description: "Clasificación OCR, validez comprobantes, CAE", icon: "📄" },
  { id: "agente_financiero", name: "Agente Financiero", description: "Tesorería, flujo de caja, ratios financieros", icon: "📈" },
];

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConv?.id]);

  const loadConversations = async (agentId) => {
    const convs = await base44.agents.listConversations({ agent_name: agentId });
    setConversations(convs || []);
  };

  const selectAgent = async (agent) => {
    setSelectedAgent(agent);
    setActiveConv(null);
    setMessages([]);
    await loadConversations(agent.id);
  };

  const newConversation = async () => {
    if (!selectedAgent) return;
    const conv = await base44.agents.createConversation({
      agent_name: selectedAgent.id,
      metadata: { name: `Nueva consulta — ${new Date().toLocaleDateString("es-AR")}` }
    });
    setActiveConv(conv);
    setMessages([]);
    await loadConversations(selectedAgent.id);
  };

  const openConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConv(full);
    setMessages(full.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const text = input;
    setInput("");
    setSending(true);
    await base44.agents.addMessage(activeConv, { role: "user", content: text });
    setSending(false);
  };

  const agentInfo = selectedAgent ? AGENTS.find(a => a.id === selectedAgent.id) : null;

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Agent selector */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase text-slate-400 px-1">Agentes IA Especializados</p>
        <div className="space-y-2">
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => selectAgent(agent)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedAgent?.id === agent.id ? "border-[#00C7D9] bg-[#E0F7FA]/40" : "border-slate-100 bg-white hover:border-slate-200"}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{agent.icon}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">{agent.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{agent.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedAgent && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Conversaciones</p>
              <button onClick={newConversation} className="w-6 h-6 rounded bg-[#00C7D9]/15 flex items-center justify-center text-[#00C7D9] hover:bg-[#00C7D9]/25">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {conversations.length === 0 && (
                <p className="text-[12px] text-slate-400 text-center py-4">Sin conversaciones. Creá una nueva.</p>
              )}
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => openConversation(conv)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${activeConv?.id === conv.id ? "border-[#00C7D9] bg-[#E0F7FA]/40" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <p className="text-[12px] text-[#1A1A2E] truncate">{conv.metadata?.name || "Consulta"}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {!selectedAgent ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C7D9] to-[#00A8BD] flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-[14px] font-medium text-slate-500">Seleccioná un Agente IA</p>
            <p className="text-[12px]">Cada agente es especialista en su área tributaria</p>
          </div>
        ) : !activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-5xl mb-4">{agentInfo?.icon}</span>
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-1">{agentInfo?.name}</h3>
            <p className="text-[13px] text-slate-500 mb-6">{agentInfo?.description}</p>
            <Button onClick={newConversation} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
              <Plus className="w-4 h-4 mr-1" /> Nueva Consulta
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <span className="text-xl">{agentInfo?.icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-[#1A1A2E]">{agentInfo?.name}</p>
                <p className="text-[11px] text-slate-400">{activeConv.metadata?.name}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-[13px]">Iniciá la consulta con el agente</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#1A1A2E] text-white" : "bg-slate-50 border border-slate-100"}`}>
                    {msg.role === "user" ? (
                      <p className="text-[13px]">{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="text-[13px] prose prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00C7D9]" />
                    <span className="text-[13px] text-slate-500">Analizando...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-slate-100">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Consultá al ${agentInfo?.name}...`}
                  className="flex-1 px-4 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20 focus:border-[#00C7D9]"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !input.trim()} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white rounded-xl px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}