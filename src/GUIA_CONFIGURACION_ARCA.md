# 🔐 Configuración de Certificados ARCA/AFIP

## Guía Rápida para Facturación Electrónica

### 📋 Requisitos Previos

1. **Certificado Digital (.pem)** - Obtenido desde AFIP
2. **Clave Privada (.pem)** - Generada junto con el certificado
3. **Clave Fiscal Nivel 3** - Con servicios WSFE y F931 habilitados

---

## 🚀 Pasos para Configurar

### Paso 1: Obtener Certificado de AFIP

1. Ingresá a [AFIP](https://www.afip.gob.ar) con tu Clave Fiscal
2. Andá a **Certificados > Servicios Web**
3. Hacé clic en **"Generar Certificado"**
4. Seleccioná los servicios:
   - ✅ WSFE (Facturación Electrónica)
   - ✅ WSFEX (Exportaciones)
   - ✅ F931 (Liquidación Sueldos)
5. Descargá el certificado `.pem`
6. Descargá la clave privada `.pem` (¡guardala en lugar seguro!)

### Paso 2: Cargar Certificados en ContaIA

1. Andá a **Configuración > Certificados ARCA/AFIP**
2. Hacé clic en **"Seleccionar archivo"** para Certificado Digital
3. Seleccioná tu archivo `.pem` de AFIP
4. Repetí el proceso para la Clave Privada
5. Ingresá tu Clave Fiscal en el campo correspondiente

### Paso 3: Configurar Secrets en Base44

1. Copiá el contenido del certificado (botón "Copiar contenido")
2. Andá a [Dashboard Base44](https://dev.base44.com)
3. Andá a **Settings > Secrets**
4. Creá las siguientes variables:

```
ARCA_CERT_PEM = [pegá el contenido del certificado .pem]
ARCA_KEY_PEM = [pegá el contenido de la clave privada .pem]
ARCA_TAX_KEY = [tu clave fiscal de AFIP]
```

5. Hacé clic en **Save**
6. Reiniciá la aplicación

### Paso 4: Probar Conexión

1. Volvé a **Configuración > Certificados ARCA/AFIP**
2. Hacé clic en **"Probar Conexión ARCA"**
3. Si todo está bien, verás: ✅ "Conexión exitosa con ARCA"

---

## 🔒 Seguridad de las Credenciales

### ¿Dónde se guardan?

- **Archivos .pem**: Se cargan temporalmente para copiar su contenido
- **Secrets**: Se guardan **encriptados** en el dashboard de Base44
- **Acceso**: Solo el backend (`functions/arcaInvoicing.js`) puede leerlos
- **Nunca** se exponen en el frontend ni se almacenan en la base de datos

### Buenas Prácticas

✅ **HACÉ**:
- Guardá los archivos .pem en lugar seguro (USB encriptado, caja de seguridad)
- Usá Clave Fiscal Nivel 3 con 2 factores de autenticación
- Rotá los certificados antes de su vencimiento (1 año)
- Revisá los logs de facturación regularmente

❌ **NO HAGAS**:
- Compartas tus archivos .pem por email
- Almacenes las claves en la nube sin encriptar
- Usés la misma clave fiscal para múltiples sistemas
- Olvides renovar el certificado antes de vencer

---

## 🛠️ Solución de Problemas

### Error: "Certificado expirado"

**Causa**: El certificado .pem tiene validez de 1 año

**Solución**:
1. Renová el certificado en AFIP
2. Descargá el nuevo .pem
3. Actualizá los secrets en Base44
4. Reiniciá la app

### Error: "Clave fiscal inválida"

**Causas posibles**:
- Clave de nivel incorrecto (necesita Nivel 3)
- Servicios WSFE/F931 no habilitados
- Clave bloqueada por múltiples intentos fallidos

**Solución**:
1. Verificá el nivel en AFIP > Clave Fiscal
2. Habilitá los servicios WSFE y F931
3. Esperá 24hs si está bloqueada
4. Contactá a AFIP si persiste

### Error: "Timeout de conexión"

**Causa**: Problemas de conectividad con servidores de AFIP

**Solución**:
1. Verificá tu conexión a internet
2. Esperá 5 minutos y reintentá
3. Si persiste, los servidores de AFIP pueden estar caídos
4. Contactá a soporte de ContaIA

---

## 📞 Soporte

Si tenés problemas con la configuración:

1. **Revisá esta guía** paso a paso
2. **Verificá los logs** en Dashboard > Functions > arcaInvoicing
3. **Contactá a soporte**: soporte@contaia.com.ar

---

## 📚 Recursos Útiles

- [Manual WSFE v1.35 (AFIP)](https://www.afip.gob.ar/wsfe/documentos/Manual_WSFE_v1.35.pdf)
- [Documentación WSFE](https://www.afip.gob.ar/wsfe/)
- [Base44 Secrets](https://dev.base44.com)

---

**Última actualización**: Junio 2026  
**Versión**: 1.0.0