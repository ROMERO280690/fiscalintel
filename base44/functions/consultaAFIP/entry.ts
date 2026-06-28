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

    // NOTA: Para consulta REAL al Registro de Contribuyentes de AFIP,
    // se necesita implementar el WS "Registro de Contribuyentes" (WSR)
    // que requiere autenticación WSAA con los certificados .pem
    // 
    // Los web services de AFIP para consulta de contribuyentes son:
    // - Producción: https://www.afip.gob.ar/fe/WSWSFEV1.asmx (no disponible para WSR)
    // - WSR Homologación: https://awshomo.afip.gov.ar/
    // - WSR Producción: https://aws.afip.gov.ar/
    //
    // Como no tenemos el WSDL del WSR disponible, devolvemos datos básicos
    // y el usuario completa manualmente. Para implementación real:
    // 1. Obtener WSDL de WSR desde AFIP
    // 2. Generar token de acceso via WSAA
    // 3. Llamar a GetContribuyente con el CUIT
    
    // Por ahora, devolvemos estructura para completar manual con tipo inferido
    return Response.json({
      found: false,
      message: "La consulta directa a AFIP requiere configuración del WS de Registro (WSR). Completá los datos manualmente.",
      cuit: cuitLimpio,
      inferred_type: inferContribuyenteType(cuitLimpio),
      instructions: "Para habilitar consulta automática: configurar WSR en ARCASettings con certificados .pem"
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