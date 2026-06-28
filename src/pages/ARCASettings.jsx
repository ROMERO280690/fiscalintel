import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Upload, CheckCircle, X, Key, FileText, Database, Cloud, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ARCASettings() {
  const [certUploaded, setCertUploaded] = useState(false);
  const [keyUploaded, setKeyUploaded] = useState(false);
  const [taxKeyUploaded, setTaxKeyUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("arca");
  const [certContent, setCertContent] = useState('');
  const [keyContent, setKeyContent] = useState('');
  const [formData, setFormData] = useState({ certFile: null, keyFile: null, taxKey: '' });

  const tabs = [
    { id: "arca", label: "Certificados ARCA/AFIP", icon: Shield },
    { id: "backup", label: "Backup y Seguridad", icon: Database },
    { id: "integrations", label: "Integraciones Bancarias", icon: Cloud }
  ];

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    setUploading(true);
    try {
      // Leer contenido del archivo directamente
      const reader = new FileReader();
      const text = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      // Guardar contenido en estado
      if (type === 'cert') {
        setCertContent(text);
        setCertUploaded(true);
        setFormData(prev => ({ ...prev, certFile: file }));
      }
      if (type === 'key') {
        setKeyContent(text);
        setKeyUploaded(true);
        setFormData(prev => ({ ...prev, keyFile: file }));
      }
      
    } catch (error) {
      alert('Error al cargar archivo: ' + error.message);
    }
    setUploading(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copiado al portapapeles. Ahora andá a Dashboard > Settings > Secrets y pegalo en la variable correspondiente.`);
  };

  const checkConnectionStatus = async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const result = await base44.functions.invoke('arcaInvoicing', {
        action: 'test_connection'
      });
      
      setConnectionStatus({
        success: result.data.success,
        message: result.data.message,
        cuit: result.data.cuit,
        certs_loaded: result.data.certs_loaded,
        timestamp: result.data.timestamp
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error.response?.data?.error || error.message,
        details: null
      });
    }
    setTesting(false);
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
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00C7D9]" />
                Certificados Digitales ARCA/AFIP
              </h3>
              <p className="text-[12px] text-slate-400">
                <strong>¿Qué cargar aquí?</strong> Subí los archivos .pem que descargaste de AFIP. Luego copiá su contenido y pegalo en los Secrets de Base44.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Certificado .pem */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">1. Certificado Digital (.pem)</p>
                    <p className="text-[11px] text-slate-400">Archivo que descargaste de AFIP</p>
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
                {certUploaded && certContent && (
                  <div className="mt-3 bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
                    <p className="text-[11px] text-emerald-400 font-medium mb-2">✓ Archivo cargado - Copiá el contenido:</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(certContent, 'Certificado')}
                      className="text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar contenido del certificado
                    </Button>
                  </div>
                )}
              </div>

              {/* Clave privada */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">2. Clave Privada (.pem)</p>
                    <p className="text-[11px] text-slate-400">La clave que generaste junto con el certificado</p>
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
                {keyUploaded && keyContent && (
                  <div className="mt-3 bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
                    <p className="text-[11px] text-emerald-400 font-medium mb-2">✓ Archivo cargado - Copiá el contenido:</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keyContent, 'Clave privada')}
                      className="text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar contenido de la clave
                    </Button>
                  </div>
                )}
              </div>

              {/* Clave fiscal */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">3. Clave Fiscal de AFIP</p>
                    <p className="text-[11px] text-slate-400">Tu contraseña de Clave Fiscal (Nivel 3)</p>
                  </div>
                  {taxKeyUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="Ingresar tu Clave Fiscal (contraseña)"
                  value={formData.taxKey}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, taxKey: e.target.value }));
                    setTaxKeyUploaded(e.target.value.length > 0);
                  }}
                  className="bg-white/5 border-white/10 text-white h-10"
                />
                {taxKeyUploaded && (
                  <div className="mt-3 bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Clave fiscal ingresada
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de prueba */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={checkConnectionStatus}
                disabled={uploading || testing}
                className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs"
              >
                {testing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 mr-1" />
                    Verificar Conexión ARCA
                  </>
                )}
              </Button>
            </div>

            {/* Estado de conexión */}
            {connectionStatus && (
              <div className={`mt-4 rounded-lg p-4 border ${connectionStatus.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <p className={`text-[13px] font-semibold ${connectionStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {connectionStatus.message}
                </p>
                {connectionStatus.cuit && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-slate-300">
                      <strong>CUIT:</strong> {connectionStatus.cuit}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <strong>Certificados:</strong> {connectionStatus.certs_loaded ? '✓ Cargados' : '✗ Faltan'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong>Timestamp:</strong> {new Date(connectionStatus.timestamp).toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            )}

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

            {/* Instrucciones de configuración de Secrets */}
            <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <p className="text-[14px] font-bold text-blue-400">🔐 Configuración Segura de Secrets</p>
              </div>
              <p className="text-[12px] text-slate-300 mb-4">
                Los secrets se guardan encriptados en el dashboard de Base44 y solo el backend puede acceder a ellos. Seguí estos pasos:
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-xs">1</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-1">Abrí el Dashboard de Base44</p>
                    <p className="text-[11px] text-slate-400">Andá a <strong>Settings &gt; Secrets</strong> en tu dashboard</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-xs">2</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-1">Creá las 3 variables</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <code className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_CERT_PEM</code>
                      <code className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_KEY_PEM</code>
                      <code className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[11px] font-mono">ARCA_TAX_KEY</code>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-xs">3</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-1">Pegá el contenido de cada archivo</p>
                    <p className="text-[11px] text-slate-400">Usá los botones "Copiar contenido" de arriba para cada archivo .pem</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-xs">4</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-1">Guardá y reiniciá</p>
                    <p className="text-[11px] text-slate-400">Hacé clic en Save y reiniciá la aplicación para aplicar los cambios</p>
                  </div>
                </li>
              </ol>

              {/* Estado de secrets */}
              <div className="mt-4 pt-4 border-t border-blue-500/30">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-slate-300">Estado de configuración:</p>
                  <StatusBadge status={certUploaded && keyUploaded && taxKeyUploaded ? 'approved' : 'pending'} />
                </div>
                {!(certUploaded && keyUploaded && taxKeyUploaded) && (
                  <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Completá los 3 pasos para habilitar la facturación electrónica
                  </p>
                )}
                {certUploaded && keyUploaded && taxKeyUploaded && (
                  <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Todos los certificados cargados - Ahora configurá los secrets en el dashboard
                  </p>
                )}
              </div>

              <div className="mt-4">
                <a
                  href="https://dev.base44.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#00C7D9] hover:text-[#00A8BD] flex items-center gap-1 font-medium"
                >
                  Ir al Dashboard de Base44
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
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