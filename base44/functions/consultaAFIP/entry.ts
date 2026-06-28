import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cuit } = await req.json();
    
    if (!cuit || typeof cuit !== 'string') {
      return Response.json({ error: 'CUIT requerido' }, { status: 400 });
    }

    // Limpiar CUIT (sacar guiones y puntos)
    const cuitLimpio = cuit.replace(/[^0-9]/g, '');
    
    if (cuitLimpio.length !== 11) {
      return Response.json({ error: 'CUIT inválido - debe tener 11 dígitos' }, { status: 400 });
    }

    // Simular consulta a AFIP - en producción esto llamaría al WS de Registro de Contribuyentes
    // Usamos InvokeLLM para obtener datos públicos del CUIT desde internet
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Buscá información pública del contribuyente argentino con CUIT ${cuitLimpio}. 
      Si encontrás datos, devolvé JSON con: business_name (razón social), fantasy_name (nombre de fantasía si existe), 
      address (domicilio fiscal), city (localidad), province (provincia), activity (actividad principal), 
      client_type (clasificá en: monotributista, responsable_inscripto, autonomo, sas, srl, sa, cooperativa, agro, pyme).
      Si no encontrás información, devolvé solo { "found": false }`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean" },
          business_name: { type: "string" },
          fantasy_name: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          province: { type: "string" },
          activity: { type: "string" },
          client_type: { type: "string", enum: ["monotributista", "responsable_inscripto", "autonomo", "sas", "srl", "sa", "cooperativa", "agro", "pyme"] }
        }
      },
      model: "gemini_3_flash"
    });

    if (llmResponse.found === false || !llmResponse.business_name) {
      // Si no hay datos públicos, devolvemos estructura vacía para que el usuario complete
      return Response.json({
        found: false,
        message: "No se encontraron datos públicos. Completá manualmente.",
        cuit: cuitLimpio,
        // Inferir tipo de contribuyente por el CUIT
        inferred_type: inferContribuyenteType(cuitLimpio)
      });
    }

    return Response.json({
      found: true,
      cuit: cuitLimpio,
      business_name: llmResponse.business_name || "",
      fantasy_name: llmResponse.fantasy_name || "",
      address: llmResponse.address || "",
      city: llmResponse.city || "",
      province: llmResponse.province || "",
      activity: llmResponse.activity || "",
      client_type: llmResponse.client_type || inferContribuyenteType(cuitLimpio)
    });

  } catch (error) {
    console.error('Error consulta AFIP:', error);
    return Response.json({ 
      error: 'Error consultando AFIP', 
      details: error.message 
    }, { status: 500 });
  }
});

// Inferir tipo de contribuyente basado en el inicio del CUIT
function inferContribuyenteType(cuit) {
  const inicio = cuit.substring(0, 2);
  if (inicio === '20' || inicio === '27') return 'autonomo'; // Personas humanas
  if (inicio === '30') return 'responsable_inscripto'; // Personas jurídicas
  if (inicio === '33') return 'sas'; // SAS
  return 'responsable_inscripto';
}