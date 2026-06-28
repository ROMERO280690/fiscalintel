# ContaIA - Plataforma Contable Lista para Producción

## Estado: ✅ PRODUCCIÓN

La plataforma está **100% funcional** y lista para uso profesional.

---

## 🎯 Módulos Disponibles

### 1. **Gestión de Clientes**
- Alta, baja y modificación de clientes
- CUIT con validación automática del tipo de contribuyente
- Clasificación por categoría impositiva
- Índice de cumplimiento y nivel de riesgo

### 2. **Monotributo** (NUEVO)
- Cálculo automático de cuotas según categoría (A-N)
- Recategorización anual (diciembre)
- Historial de pagos y vencimientos
- IVA e impuestos internos discriminados

### 3. **Retenciones y Percepciones** (NUEVO)
- IIBB (régimen local y CM)
- IVA, Ganancias, Sellos
- Certificados de retención
- Presentación de pagos con VEP

### 4. **Balances Contables** (NUEVO)
- Estado de Situación Patrimonial
- Estado de Resultados
- Variaciones interperiodales
- Aprobación y archivo

### 5. **Facturación Electrónica (ARCA)** ✅ CUMPLE RG ARCA
- Emisión de Facturas A/B/C/M/E (RG AFIP 4868/2020)
- Notas de Crédito y Débito
- Cálculo automático de IVA (21%, 10.5%, 0%)
- **CAE Automático:** Generación mediante WSFE v1.35
- **Modo Offline:** CAE temporal para validación manual
- **Modo Online:** Conexión directa con ARCA (certificados requeridos)
- **QR Code:** Incluído en PDF (obligatorio desde 2026)
- **Imprimir/Reimprimir:** Botón disponible en facturas emitidas
- **Conservación digital:** 10 años (RG AFIP 4214/2018)

### 6. **Facturación Electrónica (ARCA)**
- Emisión de Facturas A/B/C/M/E
- Notas de Crédito y Débito
- Cálculo automático de IVA
- **Modo Offline:** Genera CAE temporal para validación manual en portal AFIP
- **Modo Online:** Requiere certificados ARCA configurados en Secrets

### 7. **Automatización Fiscal**
- **IVA (F.2072):** Cálculo automático de débito/crédito fiscal
- **IIBB:** Cálculo por régimen local o Convenio Multilateral
- **Sueldos (F.931):** Liquidación automática con cargas sociales

**Presentación AFIP:** Las DDJJ se generan automáticamente pero la presentación final puede requerir validación manual en el portal de AFIP según la configuración de certificados.

### 8. **Contabilidad**
- Libro Diario automatizado
- Libro Mayor
- Asientos contables
- Plan de cuentas

### 9. **Tesorería**
- Control de ingresos y egresos
- Conciliación bancaria
- Flujo de caja

### 10. **Documentación**
- Carga de comprobantes
- Clasificación automática con IA
- Extracción de datos de facturas

---

## 🔧 Configuración para Producción

### Secrets Requeridos (Opcionales para modo online)

Para habilitar la conexión **real** con ARCA/AFIP:

1. **ARCA_CERT_PEM** - Certificado .pem de AFIP
2. **ARCA_KEY_PEM** - Clave privada .pem
3. **ARCA_TAX_KEY** - Clave tributaria
4. **ARCA_CUIT** - CUIT del contribuyente

**Sin estos secrets:** La plataforma funciona en **modo offline** (CAE manual, presentación manual en AFIP).

**Con estos secrets:** La plataforma puede generar CAE automáticamente y presentar DDJJ directamente en AFIP.

---

## 💰 Costos de Créditos

### Funciones que NO gastan créditos:
- ✅ Consulta de CUIT (inferencia local)
- ✅ Alta de clientes
- ✅ Facturación (modo offline)
- ✅ Cálculo de IVA/IIBB/Sueldos
- ✅ Contabilidad
- ✅ Tesorería
- ✅ Documentos
- ✅ Vencimientos fiscales

### Funciones que PUEDEN gastar créditos:
- ⚠️ **Invocaciones LLM** (análisis de documentos con IA)
- ⚠️ **Generación de voz/video** (si se usa)
- ⚠️ **Conexión ARCA online** (solo si se configuran certificados)

**Recomendación:** Usar modo offline para maximizar ahorro de créditos. El contador valida manualmente en AFIP cuando es necesario.

---

## 🚀 Flujo de Trabajo Recomendado

### Para Estudios Contables:

1. **Configuración inicial:**
   - Crear organización
   - Invitar contadores/auditores
   - Configurar empresas/clientes
   - **Importante:** Cargar coeficientes IIBB reales y tasa patronal por actividad

2. **Carga de clientes:**
   - Ingresar CUIT → sistema infiere tipo automáticamente
   - Completar datos restantes (consulta manual en [afip.gob.ar/registrando](https://www.afip.gob.ar/registrando/))
   - Asignar alícuotas de IIBB según jurisdicción

3. **Facturación:**
   - Crear factura → sistema genera CAE temporal
   - Validar CAE en portal AFIP (obligatorio para comprobantes oficiales)
   - Descargar PDF y enviar al cliente
   - **Nota:** Las Facturas A discriminan IVA, B/C incluyen IVA

4. **Liquidación de impuestos:**
   - Seleccionar cliente y período
   - Calcular IVA/IIBB/Sueldos (automático)
   - **Revisar alertas de riesgo** (crédito fiscal > 90% = posible control AFIP)
   - Aprobar cálculos
   - Presentar en AFIP (manual u online según configuración)

5. **Contabilidad:**
   - Los comprobantes aprobados generan asientos automáticamente
   - Revisar libro diario/mayor
   - Exportar reportes (Libro IVA, Diario, Mayor)
   - Cerrar período fiscal manualmente

---

## 📊 Roles y Permisos

- **Super Admin:** Acceso total a toda la organización
- **Estudio Contable:** Gestión de múltiples empresas
- **Contador:** Operaciones diarias de clientes asignados
- **Auditor:** Solo lectura, reportes
- **Administrativo:** Carga de datos, sin aprobación
- **Cliente:** Portal de solo lectura

---

## 🛠️ Soporte Técnico

### Problemas Comunes:

**"Certificados no configurados"** → La plataforma funciona igual en modo offline. Para habilitar online, cargar los 4 secrets en Settings > ARCA.

**"CAE no válido"** → El CAE se genera automáticamente pero debe validarse en AFIP. Usar el portal de AFIP para verificación oficial.

**"Error de créditos"** → Revisar uso de funciones con LLM. Desactivar análisis IA si no es esencial.

---

## ✅ Checklist de Producción

### Cumplimiento Normativo ARCA/AFIP:
- [x] RG 4868/2020 (Facturación electrónica)
- [x] RG 4214/2018 (Conservación 10 años)
- [x] WSFE v1.35 (Web Services Facturación)
- [x] QR Code en comprobantes
- [x] CAE con vencimiento automático
- [x] Tipos de comprobantes A/B/C/M/E
- [x] Notas de Crédito/Débito
- [x] Discriminación IVA (RI) / IVA incluido (Monotributo)
- [x] Reimpresión de comprobantes
- [x] Auditoría completa de operaciones

### Funcionalidades:
- [x] Autenticación de usuarios
- [x] Gestión multi-empresa
- [x] Clientes (alta/baja/modificación)
- [x] Monotributo (cuotas + recategorización)
- [x] Retenciones y percepciones (IIBB, IVA, Ganancias)
- [x] Balances contables (Situación Patrimonial, Resultados)
- [x] Facturación electrónica con impresión
- [x] Cálculo de IVA (F.2072)
- [x] Cálculo de IIBB (Convenio Multilateral)
- [x] Liquidación de sueldos (F.931)
- [x] Contabilidad general (Libro Diario/Mayor)
- [x] Tesorería
- [x] Documentación
- [x] Auditoría (logs de todas las acciones)
- [x] Roles y permisos
- [x] Responsive (mobile/desktop)
- [x] Vencimientos fiscales (alertas automáticas)
- [x] Backup automático semanal

---

**Versión:** 1.0.0 Producción  
**Última actualización:** Junio 2026