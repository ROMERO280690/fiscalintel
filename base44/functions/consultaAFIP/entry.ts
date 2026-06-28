import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { NodeCryptoSigner } from 'npm:@fidm/x509@1.2.1';

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

    const certPem = Deno.env.get('ARCA_CERT_PEM');
    const keyPem = Deno.env.get('ARCA_KEY_PEM');
    const taxKey = Deno.env.get('ARCA_TAX_KEY');
    
    if (!certPem || !keyPem || !taxKey) {
      return Response.json({ error: 'Certificados no configurados', found: false });
    }

    // Generar token WSAA
    const now = new Date();
    const expiration = new Date(now.getTime() + 600000);
    
    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<TRA xmlns="http://www.afip.gov.ar/wsaa/TRA">
  <uniqueId>${Date.now()}</uniqueId>
  <generationTime>${formatDate(now)}</generationTime>
  <expirationTime>${formatDate(expiration)}</expirationTime>
  <service>ws_sr_constancia_inscripcion</service>
  <destination>c_</destination>
  <signer/>
</TRA>`;

    // Firmar TRA
    const signature = await signXml(tra, keyPem, certPem);

    const loginTicket = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest xmlns="http://www.afip.gov.ar/wsaa/TRA">
  <header>
    <uniqueId>${Date.now()}</uniqueId>
    <generationTime>${formatDate(now)}</generationTime>
    <expirationTime>${formatDate(expiration)}</expirationTime>
  </header>
  <request>
    <service>ws_sr_constancia_inscripcion</service>
    <destination>c_</destination>
    <signer>${taxKey}</signer>
    <signature>${signature}</signature>
  </request>
</loginTicketRequest>`;

    // Consultar usando API pública de AFIP (sin autenticación)
    const response = await fetch(`https://www.afip.gob.ar/fe/WSFEv1/service.asmx?wsdl`);
    
    // Como AFIP no tiene API pública abierta, usamos servicio alternativo
    // Para datos reales de AFIP, el contador debe consultar manualmente en:
    // https://www.afip.gob.ar/registrando/
    
    // Por ahora devolvemos estructura para completar manual
    return Response.json({
      found: false,
      message: 'La consulta directa requiere WSAA. Los datos deben consultarse en afip.gob.ar/registrando',
      cuit: cuitLimpio,
      inferred_type: inferTipo(cuitLimpio),
      manualUrl: 'https://www.afip.gob.ar/registrando/'
    });

    if (!razonSocial || estado !== 'ACTIVO') {
      return Response.json({
        found: false,
        message: 'CUIT no encontrado o inactivo en AFIP',
        cuit: cuitLimpio,
        inferred_type: inferTipo(cuitLimpio)
      });
    }

    return Response.json({
      found: true,
      cuit: cuitLimpio,
      business_name: razonSocial,
      fantasy_name: nombreFantasia || '',
      address: domicilio || '',
      city: localidad || '',
      province: provincia || '',
      activity: actividad || '',
      client_type: clasificarTipo(categoria, cuitLimpio),
      categoria: categoria || '',
      estado: estado
    });

  } catch (error) {
    console.error('Error consulta AFIP:', error);
    return Response.json({ 
      error: 'Error consultando AFIP: ' + error.message,
      found: false
    }, { status: 500 });
  }
});

function formatDate(date) {
  return date.toISOString().split('.')[0] + '-03:00';
}

function extractXmlTag(xml, tag) {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

async function signXml(data, privateKeyPem, certPem) {
  // Implementación simplificada de firma RSA-SHA256
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Importar clave privada
  const keyPemClean = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryString = atob(keyPemClean);
  const keyBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    keyBytes[i] = binaryString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataBytes);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function clasificarTipo(categoria, cuit) {
  const cat = (categoria || '').toLowerCase();
  if (cat.includes('monotributo')) return 'monotributista';
  if (cat.includes('exento')) return 'exento';
  return inferTipo(cuit);
}

function inferTipo(cuit) {
  const inicio = cuit.substring(0, 2);
  if (inicio === '20' || inicio === '27') return 'autonomo';
  if (inicio === '30') return 'responsable_inscripto';
  if (inicio === '33') return 'sas';
  return 'responsable_inscripto';
}