import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrialBanner({ trialEndDays, onDismiss }) {
  const isUrgent = trialEndDays <= 7;
  const isExpired = trialEndDays < 0;

  if (isExpired) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <p className="text-[13px] text-rose-800 font-medium">
              Tu período de prueba ha expirado. Contactá a soporte para continuar usando ContaIA.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-600 hover:bg-rose-100">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (trialEndDays <= 30) {
    return (
      <div className={`${isUrgent ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"} border-b px-4 py-2.5`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-4 h-4 ${isUrgent ? "text-amber-600" : "text-blue-600"} flex-shrink-0`} />
            <p className={`text-[13px] ${isUrgent ? "text-amber-800" : "text-blue-800"} font-medium`}>
              {isUrgent 
                ? `⚠️ Tu trial termina en ${trialEndDays} día${trialEndDays !== 1 ? "s" : ""}. ¡Quedate con ContaIA!`
                : `Tu período de prueba de 60 días termina en ${trialEndDays} día${trialEndDays !== 1 ? "s" : ""}.`
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss} className={`h-7 px-2 ${isUrgent ? "text-amber-600 hover:bg-amber-100" : "text-blue-600 hover:bg-blue-100"}`}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}