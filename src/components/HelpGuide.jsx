import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HelpCircle, BookOpen, Video, MessageSquare, ChevronRight } from "lucide-react";

const quickStartSteps = [
  {
    title: "1. Crear Organización",
    desc: "Configurá tu estudio contable con nombre, CUIT y datos de contacto.",
  },
  {
    title: "2. Cargar Primera Empresa",
    desc: "Agregá los datos de la empresa que vas a administrar (razón social, CUIT, tipo).",
  },
  {
    title: "3. Invitar Usuarios",
    desc: "Sumá contadores, liquidadores o administrativos al equipo con roles específicos.",
  },
  {
    title: "4. Cargar Documentos",
    desc: "Subí facturas, comprobantes y DDJJ al Expediente Digital para clasificación con IA.",
  },
  {
    title: "5. Generar DDJJ",
    desc: "Usá la IA para calcular IVA, IIBB, Ganancias y generar declaraciones juradas.",
  },
];

const modules = [
  { name: "Clientes", path: "/clients", desc: "Gestioná contribuyentes, categorías y riesgos fiscales" },
  { name: "Expediente Digital", path: "/documents", desc: "Documentos clasificados por IA con aprobación" },
  { name: "Facturación", path: "/invoicing", desc: "Emisión de facturas electrónicas con CAE" },
  { name: "DDJJ", path: "/tax-filings", desc: "IVA, IIBB, Ganancias, Bienes Personales" },
  { name: "Sueldos", path: "/payroll", desc: "Liquidaciones, F931, cargas sociales" },
  { name: "Contabilidad", path: "/accounting", desc: "Libro diario, mayor, balances" },
  { name: "Tesorería", path: "/treasury", desc: "Cobros, pagos, conciliación bancaria" },
  { name: "Societario", path: "/corporate", desc: "Actas, libros, estatutos" },
  { name: "Reportes", path: "/financial-reports", desc: "Balances, estados de resultados" },
  { name: "Agentes IA", path: "/agents", desc: "Asistentes especializados por área" },
];

export default function HelpGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/5"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-[#0D0E1A] border-white/10 text-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00C7D9]" />
            Centro de Ayuda
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Guía rápida para empezar a usar ContaIA
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Start */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#00C7D9]" />
              Inicio Rápido
            </h3>
            <div className="space-y-2">
              {quickStartSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                  <ChevronRight className="w-4 h-4 text-[#00C7D9] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-white">{step.title}</p>
                    <p className="text-[11px] text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00C7D9]" />
              Módulos Principales
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {modules.map((mod, i) => (
                <a
                  key={i}
                  href={mod.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div>
                    <p className="text-[13px] font-medium text-white group-hover:text-[#00C7D9] transition-colors">
                      {mod.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{mod.desc}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-[#00C7D9]" />
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00C7D9]" />
              Soporte
            </h3>
            <div className="space-y-2">
              <a
                href="mailto:soporte@contaia.com"
                className="block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <p className="text-[13px] font-medium text-white">Email de Soporte</p>
                <p className="text-[11px] text-slate-400">soporte@contaia.com</p>
              </a>
              <a
                href="https://wa.me/5491112345678"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <p className="text-[13px] font-medium text-white">WhatsApp</p>
                <p className="text-[11px] text-slate-400">+54 9 11 1234-5678</p>
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}