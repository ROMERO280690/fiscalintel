import React from "react";
import { AlertTriangle, CheckCircle, ExternalLink, FileText, Key, Shield } from "lucide-react";

export default function ARCASetupGuide() {
  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-xl p-6 border border-violet-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-white">Guía de Configuración ARCA/AFIP</h3>
          <p className="text-[12px] text-slate-400">Seguí estos pasos para habilitar la facturación electrónica</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Paso 1 */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-sm">1</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white mb-2">Obtené tu Certificado Digital</p>
              <ol className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Ingresá a <a href="https://www.afip.gob.ar" target="_blank" rel="noopener noreferrer" className="text-[#00C7D9] hover:text-[#00A8BD] flex items-center gap-1 inline-flex">AFIP <ExternalLink className="w-3 h-3" /></a></li>
                <li>Andá a <strong>Certificados &gt; Servicios Web</strong></li>
                <li>Generá un nuevo certificado para "WSFE - Facturación Electrónica"</li>
                <li>Descargá el archivo <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">certificado.pem</code></li>
              </ol>
            </div>
          </div>
        </div>

        {/* Paso 2 */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-sm">2</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white mb-2">Generá la Clave Privada</p>
              <ol className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Al crear el certificado, AFIP te pide generar una clave privada</li>
                <li>Guardá el archivo <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">clave_privada.pem</code> en un lugar SEGURO</li>
                <li className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Nunca compartas este archivo - es como tu contraseña
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Paso 3 */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-sm">3</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white mb-2">Habilitá tu Clave Fiscal</p>
              <ol className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Ingresá a AFIP con tu Clave Fiscal Nivel 3</li>
                <li>Andá a <strong>Administrador de Relaciones</strong></li>
                <li>Habilitá los servicios: <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">WSFE</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">F931</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">Libro Digital</code></li>
                <li>Anotá tu Clave Fiscal (la vas a necesitar)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Paso 4 */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-sm">4</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white mb-2">Configurá los Secrets en Base44</p>
              <ol className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Andá a <a href="https://dev.base44.com/" target="_blank" rel="noopener noreferrer" className="text-[#00C7D9] hover:text-[#00A8BD] flex items-center gap-1 inline-flex">Dashboard Base44 <ExternalLink className="w-3 h-3" /></a></li>
                <li>Settings &gt; Secrets</li>
                <li>Creá estas 3 variables:
                  <div className="flex flex-wrap gap-2 mt-2">
                    <code className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_CERT_PEM</code>
                    <code className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_KEY_PEM</code>
                    <code className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_TAX_KEY</code>
                  </div>
                </li>
                <li>Pegá el contenido de cada archivo .pem en su variable correspondiente</li>
                <li>Hacé clic en <strong>Save</strong> y reiniciá la aplicación</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Estado final */}
        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-[13px] font-bold text-emerald-400">¡Listo! Una vez configurado:</p>
          </div>
          <ul className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
            <li>Podés emitir facturas con CAE automático</li>
            <li>Generás PDFs con código QR (RG 4744/2020)</li>
            <li>Consultás el estado de CAE en tiempo real</li>
            <li>Exportás libros oficiales para AFIP</li>
          </ul>
        </div>

        {/* Recursos útiles */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[12px] font-semibold text-white mb-2">📚 Recursos útiles:</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.afip.gob.ar/wsfe/" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#00C7D9] hover:text-[#00A8BD] flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Documentación WSFE AFIP
            </a>
            <a href="https://www.afip.gob.ar/wsfe/documentos/Manual_WSFE_v1.35.pdf" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#00C7D9] hover:text-[#00A8BD] flex items-center gap-1">
              <Key className="w-3 h-3" />
              Manual WSFE v1.35 (PDF)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}