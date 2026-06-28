import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileText, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DocumentUpload({ clients, onClose, onComplete }) {
  const [clientId, setClientId] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const processWithAI = async (fileUrl, title) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizá este comprobante fiscal argentino y extraé los datos. Clasificá el tipo de comprobante y extraé: tipo (factura_a, factura_b, factura_c, nota_credito, nota_debito, recibo, ticket, contrato, ddjj, certificado, otro), monto total, monto neto, monto de IVA, fecha, número CAE, punto de venta, número de comprobante, CUIT del emisor, nombre del emisor, y período fiscal si corresponde. Respondé en JSON.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            doc_type: { type: "string" },
            amount: { type: "number" },
            net_amount: { type: "number" },
            tax_amount: { type: "number" },
            date: { type: "string" },
            cae_number: { type: "string" },
            point_of_sale: { type: "string" },
            invoice_number: { type: "string" },
            issuer_cuit: { type: "string" },
            issuer_name: { type: "string" },
            period: { type: "string" },
            classification: { type: "string" },
            confidence: { type: "number" },
            category: { type: "string" }
          }
        }
      });
      return result;
    } catch (e) {
      console.error("AI processing error:", e);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!clientId || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Subiendo ${i + 1}/${files.length}: ${file.name}`);

      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        const docData = {
          client_id: clientId,
          title: file.name,
          file_url,
          status: "processing",
        };
        const created = await base44.entities.Document.create(docData);

        setProgress(`Procesando con IA ${i + 1}/${files.length}: ${file.name}`);
        const aiResult = await processWithAI(file_url, file.name);

        if (aiResult) {
          await base44.entities.Document.update(created.id, {
            status: "pending_review",
            doc_type: aiResult.doc_type || "otro",
            amount: aiResult.amount || 0,
            net_amount: aiResult.net_amount || 0,
            tax_amount: aiResult.tax_amount || 0,
            date: aiResult.date || "",
            cae_number: aiResult.cae_number || "",
            point_of_sale: aiResult.point_of_sale || "",
            invoice_number: aiResult.invoice_number || "",
            issuer_cuit: aiResult.issuer_cuit || "",
            issuer_name: aiResult.issuer_name || "",
            period: aiResult.period || "",
            ai_classification: aiResult.classification || "",
            ai_confidence: aiResult.confidence || 0,
            ai_extracted_data: JSON.stringify(aiResult),
            category: aiResult.category || "general",
          });
        } else {
          await base44.entities.Document.update(created.id, { status: "uploaded" });
        }
      } catch (e) {
        console.error("Upload error:", e);
      }
    }

    setUploading(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md m-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A1A2E]">Cargar Documentos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Cliente *</Label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
              <option value="">Seleccionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name} — {c.cuit}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-[12px] font-medium text-slate-600">Archivos *</Label>
            <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-8 px-4 cursor-pointer hover:border-[#00C7D9] hover:bg-[#E0F7FA]/20 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-[13px] font-medium text-slate-600">
                {files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : "Arrastrá o hacé clic para subir"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PDF, imágenes o documentos</p>
              <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-[12px] text-[#00A8BD] bg-[#E0F7FA] rounded-lg px-3 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Bot className="w-4 h-4 text-amber-500" />
            <span>La IA clasificará los datos. Cada documento requerirá <strong>aprobación manual</strong> del contador antes de quedar finalizado.</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !clientId || files.length === 0} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {uploading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Procesando...</> : <><Upload className="w-3.5 h-3.5 mr-1" /> Subir y Procesar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}