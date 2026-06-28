import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Upload, CheckCircle, X, Key, FileText, Database, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";

export default function ARCASettings() {
  const [certUploaded, setCertUploaded] = useState(false);
  const [keyUploaded, setKeyUploaded] = useState(false);
  const [taxKeyUploaded, setTaxKeyUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState("arca");

  const tabs = [
    { id: "arca", label: "Certificados ARCA/AFIP", icon: Shield },
    { id: "backup", label: "Backup y Seguridad", icon: Database },
    { id: "integrations", label: "Integraciones Bancarias", icon: Cloud }
  ];

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      // Leer contenido del archivo
      const text = await file.text();
      
      // Guardar en variables de entorno (simulado - en producción usar dashboard)
      const secretName = type === 'cert' ? 'ARCA_CERT_PEM' : type === 'key' ? 'ARCA_KEY_PEM' : 'ARCA_TAX_KEY';
      
      // Mostrar instrucciones para guardar el secreto
      alert(`Archivo cargado: ${file.name}\n\nPara activar la facturación electrónica:\n1. Andá a Dashboard > Settings > Secrets\n2. Creá la variable ${secretName}\n3. Pegá el contenido del archivo .pem\n4. Guardá y reiniciá la app`);
      
      if (type === 'cert') setCertUploaded(true);
      if (type === 'key') setKeyUploaded(true);
      if (type === 'tax') setTaxKeyUploaded(true);
      
    } catch (error) {
      alert('Error al cargar archivo: ' + error.message);
    }
    setUploading(false);
  };

  const testARCAConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await base44.functions.invoke('arcaInvoicing', {
        invoice_id: 'test',
        action: 'consult_cae'
      });
      
      setTestResult({
        success: result.data.success,
        message: 'Conexión exitosa con ARCA',
        details: result.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || error.message,
        details: null
      });
    }
    setTesting(false);
  };

  const runBackupNow = async () => {
    try {
      const result = await base44.functions.invoke('automaticBackup', {
        backup_type: 'full'
      });
      alert(`Backup completado:\n- Registros: ${result.data.backup_info.total_records}\n- Tamaño: ${result.data.backup_info.size_mb} MB\n- Estado: ${result.data.backup_info.status}`);
    } catch (error) {
      alert('Error en backup: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <PageHeader title="Configuración del Sistema" subtitle="Certificados, backup e integraciones">
        <Button onClick={runBackupNow} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
          <Database className="w-3.5 h-3.5 mr-1" /> Backup Ahora
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#00C7D9] text-[#00C7D9]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: ARCA/AFIP */}
      {activeTab === "arca" && (
        <div className="space-y-6 max-w-4xl">
          {/* Estado de certificados */}
          <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
            <h3 className="text-[15px] font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00C7D9]" />
              Certificados Digitales ARCA/AFIP
            </h3>
            
            <div className="space-y-4">
              {/* Certificado .pem */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Certificado Digital (.pem)</p>
                    <p className="text-[11px] text-slate-400">Certificado firmado por AFIP para servicios web</p>
                  </div>
                  {certUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept=".pem,.crt"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'cert')}
                  className="text-[12px] text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[#00C7D9] file:text-white hover:file:bg-[#00A8BD]"
                  disabled={uploading}
                />
              </div>

              {/* Clave privada */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Clave Privada (.pem)</p>
                    <p className="text-[11px] text-slate-400">Clave privada del certificado (mantener segura)</p>
                  </div>
                  {keyUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept=".pem,.key"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'key')}
                  className="text-[12px] text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[#00C7D9] file:text-white hover:file:bg-[#00A8BD]"
                  disabled={uploading}
                />
              </div>

              {/* Clave fiscal */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Clave Fiscal ARCA</p>
                    <p className="text-[11px] text-slate-400">Nivel 3 con servicios habilitados (WSFE, F931)</p>
                  </div>
                  {taxKeyUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="Ingresar clave fiscal"
                  className="bg-white/5 border-white/10 text-white"
                  onChange={(e) => setTaxKeyUploaded(e.target.value.length > 0)}
                />
              </div>
            </div>

            {/* Botón de prueba */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={testARCAConnection}
                disabled={uploading || testing || !certUploaded || !keyUploaded || !taxKeyUploaded}
                className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs"
              >
                {testing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Probando...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 mr-1" />
                    Probar Conexión ARCA
                  </>
                )}
              </Button>
            </div>

            {/* Resultado del test */}
            {testResult && (
              <div className={`mt-4 rounded-lg p-4 border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <p className={`text-[13px] font-semibold ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testResult.message}
                </p>
                {testResult.details && (
                  <pre className="mt-2 text-[11px] text-slate-400 overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Instrucciones */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-[13px] font-semibold text-blue-400 mb-2">📋 Pasos para activar facturación electrónica:</p>
              <ol className="text-[12px] text-slate-300 space-y-1 list-decimal list-inside">
                <li>Subí tu certificado .pem (obtenido de AFIP)</li>
                <li>Subí tu clave privada .pem</li>
                <li>Ingresá tu Clave Fiscal con nivel 3</li>
                <li>Andá a <strong>Dashboard &gt; Settings &gt; Secrets</strong></li>
                <li>Creá las variables: <code className="bg-white/10 px-1 rounded">ARCA_CERT_PEM</code>, <code className="bg-white/10 px-1 rounded">ARCA_KEY_PEM</code>, <code className="bg-white/10 px-1 rounded">ARCA_TAX_KEY</code></li>
                <li>Pegá el contenido de cada archivo en su variable correspondiente</li>
                <li>Reiniciá la aplicación</li>
                <li>Probá la conexión con el botón de arriba</li>
              </ol>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
            <h4 className="text-[14px] font-bold text-white mb-3">Servicios habilitados:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'WSFE', desc: 'Facturación Electrónica', status: 'Activo' },
                { name: 'WSFEX', desc: 'Facturación de Exportación', status: 'Activo' },
                { name: 'F931', desc: 'Liquidación Sueldos', status: 'Activo' },
                { name: 'Libro Digital', desc: 'Libros IVA/Contables', status: 'Activo' },
                { name: 'Consulta CUIT', desc: 'Validación contribuyentes', status: 'Activo' },
                { name: 'Teledeclaración', desc: 'DDJJ Automáticas', status: 'Pendiente' }
              ].map(service => (
                <div key={service.name} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[13px] font-semibold text-white">{service.name}</p>
                  <p className="text-[10px] text-slate-400">{service.desc}</p>
                  <span className={`text-[10px] font-medium ${service.status === 'Activo' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup */}
      {activeTab === "backup" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
            <h3 className="text-[15px] font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Backup Automático
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Backup Semanal</p>
                    <p className="text-[11px] text-slate-400">Se ejecuta todos los domingos a las 3:00 AM</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Entidades respaldadas</p>
                    <p className="text-[11px] text-slate-400">Clientes, Documentos, Facturas, Asientos, Sueldos, etc.</p>
                  </div>
                  <FileText className="w-5 h-5 text-[#00C7D9]" />
                </div>
              </div>

              <Button onClick={runBackupNow} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Database className="w-4 h-4 mr-2" /> Ejecutar Backup Ahora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Integraciones */}
      {activeTab === "integrations" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
            <h3 className="text-[15px] font-bold text-white mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-400" />
              Integraciones Bancarias
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-[13px] font-semibold text-white mb-2">Conciliación Automática</p>
                <p className="text-[11px] text-slate-400 mb-3">Importá extractos bancarios y conciliá automáticamente con IA</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-xs bg-white/5 border-white/10 text-white">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Importar Extracto
                  </Button>
                  <Button className="text-xs bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Conciliar con IA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}