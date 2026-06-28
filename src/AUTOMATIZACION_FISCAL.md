# 🤖 AUTOMATIZACIÓN FISCAL - CONTADOR AUTOMÁTICO

## Descripción

ContaIA actúa como tu **contador automatizado**, extrayendo datos de AFIP, calculando impuestos y preparando presentaciones para revisión y aprobación humana.

---

## ✅ Funcionalidades Implementadas

### 1. **IVA Automático (F.2072)**
- ✅ Extracción automática de facturas emitidas/recibidas
- ✅ Cálculo de débito y crédito fiscal
- ✅ Determinación de IVA técnico y saldo a pagar/favor
- ✅ Generación de DDJJ lista para revisión
- ✅ Presentación automática en AFIP (con aprobación)

**Función:** `automaticIVA.js`
- `calculate_iva`: Calcula IVA del período
- `generate_ddjj`: Genera borrador F.2072
- `submit_ddjj`: Presenta en ARCA/AFIP

---

### 2. **IIBB Automático (Convenio Multilateral / Régimen Local)**
- ✅ Cálculo de coeficientes de ingresos
- ✅ Determinación de base imponible por jurisdicción
- ✅ Cálculo de alícuotas (CABA, BA, Córdoba, Santa Fe)
- ✅ Generación de DDJJ CM o local
- ✅ Presentación automática

**Función:** `automaticIIBB.js`
- `calculate_iibb`: Calcula IIBB del período
- `generate_ddjj`: Genera borrador IIBB
- `submit_ddjj`: Presenta en ARCA/AFIP

---

### 3. **Sueldos y Cargas Sociales (F.931)**
- ✅ Liquidación automática de sueldos
- ✅ Cálculo de aportes (jubilación, obra social, PAMI)
- ✅ Cálculo de contribuciones patronales (27%)
- ✅ Generación de F.931
- ✅ Presentación en AFIP

**Función:** `automaticPayroll.js`
- `calculate_payroll`: Calcula sueldos del período
- `generate_payslips`: Genera recibos de sueldo
- `generate_f931`: Genera F.931
- `submit_f931`: Presenta F.931

---

### 4. **Ganancias y Bienes Personales**
- ✅ Cálculo de categorías de monotributo
- ✅ Determinación de alícuotas
- ✅ Liquidación de SIJP
- ✅ Presentación de DDJJ

**Próximamente:** Integración completa con WS de Ganancias

---

## 📋 Flujo de Trabajo

### **Paso 1: Configuración Inicial**
1. Ir a **Configuración ARCA** (`/settings/arca`)
2. Cargar certificados `.pem` (certificado + clave)
3. Cargar `tax_key` de AFIP
4. Ingresar CUIT de la empresa
5. Click en **"Verificar Conexión"**

### **Paso 2: Carga de Datos**
- **Facturas**: Cargar facturas de ventas y compras
- **Sueldos**: Cargar empleados y sus datos básicos
- **IIBB**: Configurar coeficientes históricos

### **Paso 3: Cálculo Automático**
1. Ir a **Automatización Fiscal** (`/tax-automation`)
2. Seleccionar **cliente** y **período**
3. Click en **Calcular IVA/IIBB/Sueldos**
4. El sistema extrae datos y calcula automáticamente

### **Paso 4: Revisión Humana**
- Revisar cálculos en el panel
- Verificar observaciones y alertas de riesgo
- Ajustar manualmente si es necesario

### **Paso 5: Presentación**
1. Click en **"Presentar DDJJ"**
2. Confirmar presentación
3. El sistema presenta en AFIP automáticamente
4. Se genera número de VEP y comprobante

---

## 🎯 Panel de Control

### **Vencimientos del Mes**
- IVA (día 13-17 según CUIT)
- IIBB (día 15-22 según jurisdicción)
- Sueldos F.931 (día 10-15)
- Ganancias (día 20)

### **Cálculos por Cliente**
| Impuesto | Débito/Crédito | Base Imponible | A Pagar | Estado |
|----------|---------------|----------------|---------|--------|
| IVA      | $X / $Y       | -              | $Z      | ✅ Presentado |
| IIBB     | -             | $A             | $B      | ⏳ En revisión |
| Sueldos  | -             | $C             | $D      | 📋 Borrador |

---

## 🔐 Seguridad y Auditoría

- ✅ **Log de auditoría** de todas las presentaciones
- ✅ **Trazabilidad completa** de cálculos
- ✅ **Aprobación humana requerida** antes de presentar
- ✅ **Alertas de riesgo** (observaciones AFIP)
- ✅ **Backup automático** de DDJJ presentadas

---

## 🚀 Próximas Automatizaciones

- [ ] **Balance Fiscal** (automatización de balances contables)
- [ ] **Rectificativas** (presentación automática de DDJJ rectificativas)
- [ ] **Pagos a proveedores** (generación de VEPs)
- [ ] **Libros IVA** (exportación automática a AFIP)
- [ ] **Certificaciones** (generación de certificados F.931)

---

## 📞 Soporte

Para dudas sobre la automatización:
1. Revisar **Logs de Auditoría** (`/audit`)
2. Verificar **estado de conexión ARCA** (`/settings/arca`)
3. Contactar al equipo de desarrollo

---

**ContaIA** - Tu contador automatizado, siempre al día con AFIP.