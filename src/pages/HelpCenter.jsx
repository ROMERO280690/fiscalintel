import React, { useState } from "react";
import { BookOpen, ExternalLink, ChevronRight, Video, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const guides = [
  {
    category: "🚀 Primeros Pasos",
    items: [
      { title: "Configurar tu estudio contable", desc: "Creá tu organización y cargá tus primeras empresas", icon: BookOpen },
      { title: "Cargar certificados ARCA", desc: "Subí tu certificado .pem para facturar electrónicamente", icon: FileText, link: "/settings/arca" },
      { title: "Invitar colaboradores", desc: "Agregá contadores, liquidadores y auditores a tu equipo", icon: MessageCircle },
    ]
  },
  {
    category: "📋 Módulos Principales",
    items: [
      { title: "Gestión de Clientes", desc: "Alta, categorías impositivas y riesgo fiscal", icon: BookOpen, link: "/clients" },
      { title: "Facturación Electrónica", desc: "Generá CAE, imprimí facturas con QR", icon: FileText, link: "/invoicing" },
      { title: "Libros Contables", desc: "Libro Diario, IVA Compras/Ventas formato AFIP", icon: FileText, link: "/financial-reports" },
      { title: "Sueldos y Liquidación", desc: "Empleados, recibos y F931 automático", icon: BookOpen, link: "/payroll" },
      { title: "Impuestos y DDJJ", desc: "IVA, IIBB, Ganancias con cálculo IA", icon: BookOpen, link: "/tax-filings" },
      { title: "Conciliación Bancaria", desc: "Importá extractos y conciliá con IA", icon: Video, link: "/bank-reconciliation" },
    ]
  },
  {
    category: "🤖 Inteligencia Artificial",
    items: [
      { title: "Agentes Especializados", desc: "8 agentes IA para cada área contable", icon: MessageCircle, link: "/agents" },
      { title: "Clasificación de Documentos", desc: "La IA clasifica y extrae datos automáticamente", icon: FileText, link: "/documents" },
      { title: "Asistente Fiscal IA", desc: "Consultas en lenguaje natural sobre normativa", icon: MessageCircle, link: "/ai-assistant" },
    ]
  },
  {
    category: "⚙️ Configuración",
    items: [
      { title: "Certificados ARCA/AFIP", desc: "Configurá facturación electrónica", icon: FileText, link: "/settings/arca" },
      { title: "Backup Automático", desc: "Tu información se respalda semanalmente", icon: BookOpen },
      { title: "Permisos y Roles", desc: "Control de acceso granular por módulo", icon: BookOpen, link: "/companies" },
    ]
  },
];

export default function HelpGuide() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGuides = guides.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#0A0B14] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Centro de Ayuda ContaIA</h1>
          <p className="text-slate-400 text-sm">Documentación, tutoriales y guías para tu estudio contable</p>
        </div>

        {/* Búsqueda */}
        <div className="bg-[#1A1A2E] rounded-xl p-4 border border-white/10 mb-6">
          <input
            type="text"
            placeholder="Buscar guía (ej: facturación, sueldos, ARCA...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
          />
        </div>

        {/* Guías */}
        <div className="space-y-6">
          {filteredGuides.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-[15px] font-bold text-white mb-3">{section.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#1A1A2E] rounded-xl p-4 border border-white/10 hover:border-[#00C7D9]/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00C7D9]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-[#00C7D9]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold text-white mb-1 group-hover:text-[#00C7D9] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[12px] text-slate-400 mb-3">{item.desc}</p>
                        {item.link && (
                          <Button
                            size="sm"
                            onClick={() => window.location.href = item.link}
                            className="bg-[#00C7D9]/10 hover:bg-[#00C7D9]/20 text-[#00C7D9] text-xs h-7 px-3"
                          >
                            Abrir
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Videos Tutoriales */}
        <div className="mt-8">
          <h2 className="text-[15px] font-bold text-white mb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#00C7D9]" />
            Videos Tutoriales
          </h2>
          <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Configurar ARCA", duration: "5:23" },
                { title: "Generar Factura con CAE", duration: "3:45" },
                { title: "Conciliación Bancaria IA", duration: "4:12" },
              ].map((video, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#00C7D9]/30 transition-all cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-[#00C7D9]/20 to-[#00C7D9]/5 rounded-lg mb-3 flex items-center justify-center">
                    <Video className="w-8 h-8 text-[#00C7D9]" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-white mb-1">{video.title}</h3>
                  <p className="text-[11px] text-slate-400">{video.duration}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contacto Soporte */}
        <div className="mt-8 bg-gradient-to-r from-[#00C7D9]/10 to-[#00C7D9]/5 rounded-xl p-6 border border-[#00C7D9]/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">¿Necesitás ayuda adicional?</h3>
              <p className="text-[13px] text-slate-300">Nuestro equipo de soporte está disponible de Lunes a Viernes de 9 a 18hs</p>
            </div>
            <Button className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}