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

    const cuitLimpio = cuit.replace(/[^0-9]/g, '');
    
    if (cuitLimpio.length !== 11) {
      return Response.json({ error: 'CUIT inválido' }, { status: 400 });
    }

    // Inferir datos del CUIT sin llamar a AFIP (ahorra créditos)
    const inicio = cuitLimpio.substring(0, 2);
    let tipoPersona = 'responsable_inscripto';
    let inferredType = 'responsable_inscripto';
    
    if (inicio === '20' || inicio === '27') {
      tipoPersona = 'persona_fisica';
      inferredType = 'autonomo';
    } else if (inicio === '30') {
      tipoPersona = 'persona_juridica';
      inferredType = 'responsable_inscripto';
    } else if (inicio === '33') {
      tipoPersona = 'persona_juridica';
      inferredType = 'sas';
    }

    // Devolvemos estructura para completar manual - SIN LLAMADAS EXTERNAS
    return Response.json({
      found: false,
      manual: true,
      cuit: cuitLimpio,
      tipo_persona: tipoPersona,
      inferred_type: inferredType,
      message: 'Completar datos manualmente consultando en AFIP',
      afipUrl: 'https://www.afip.gob.ar/registrando/'
    });

  } catch (error) {
    console.error('Error consulta AFIP:', error);
    return Response.json({ 
      error: 'Error: ' + error.message,
      found: false
    }, { status: 500 });
  }
});