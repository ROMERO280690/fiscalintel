# 📘 ContaIA - ERP Contable Inteligente

## Bienvenida al Sistema

**ContaIA** es la plataforma integral para estudios contables que administran cientos de empresas. Combina automatización con IA, gestión multi-empresa y todas las herramientas necesarias para operaciones contables, impositivas y laborales.

---

## 🚀 Primeros Pasos

### 1. **Registro Inicial**
- Ingresá a `/register` y creá tu cuenta con email y contraseña
- Verificá tu email con el código OTP que recibirás
- Completá el **Onboarding** que te guiará para:
  - Crear tu **Organización** (estudio contable)
  - Cargar la **primera empresa** a administrar

### 2. **Configuración de la Organización**
- **Nombre del estudio**: Razón social de tu estudio contable
- **Tipo**: Estudio Contable, Grupo Económico, Holding, etc.
- **CUIT**: Datos fiscales del estudio
- **Email y teléfono**: Contacto principal

### 3. **Carga de Empresas**
- Cada empresa/cliente se carga con:
  - Razón social y nombre de fantasía
  - CUIT y tipo de contribuyente
  - Datos de contacto y domicilio
  - Color de identificación visual

### 4. **Invitar Usuarios al Equipo**
Desde `/companies` podés invitar:
- **Contadores**: Operaciones contables/impositivas completas
- **Liquidadores**: Sueldos y facturación
- **Administrativos**: Tareas, documentos, clientes
- **Auditores**: Solo lectura + logs de auditoría
- **Clientes**: Portal propio (solo sus datos)

---

## 📁 Módulos Principales

### **Dashboard** (`/`)
- Vista personalizada según tu rol
- KPIs en tiempo real: clientes activos, obligaciones, procesos IA
- Calendario de vencimientos
- Alertas de riesgo fiscal
- Actividad reciente

### **Clientes** (`/clients`)
- Alta, edición y baja de contribuyentes
- Categorización (Monotributista, RI, SAS, SRL, etc.)
- Niveles de riesgo fiscal
- Asignación de contador responsable
- Historial de cumplimiento

### **Expediente Digital** (`/documents`)
- **Subida de documentos**: Facturas, comprobantes, DDJJ
- **Clasificación automática con IA**: La IA categoriza y extrae datos
- **Aprobación/rechazo**: Flujo de revisión antes de contabilizar
- **Búsqueda inteligente**: Por cliente, período, tipo, monto

### **Facturación Electrónica** (`/invoicing`)
- Emisión de facturas A, B, C, M, E
- Notas de crédito y débito
- Cálculo automático de IVA
- Generación de CAE (integración AFIP)
- Historial de comprobantes

### **DDJJ / Impuestos** (`/tax-filings`)
- **IVA**: Cálculo de débito/crédito, saldo a pagar
- **IIBB**: Coeficientes locales y Convenio Multilateral
- **Ganancias**: Cálculo de percepciones y pagos a cuenta
- **Bienes Personales**: Declaración de activos
- **IA Fiscal**: La IA calcula y sugiere importes con alertas de riesgo

### **Sueldos & F931** (`/payroll`)
- **Liquidación de sueldos**: Cálculo automático con IA
- **Cargas sociales**: Jubilación, obra social, ANSSAL, sindicales
- **F931**: Generación de formulario para AFIP
- **Recibos de sueldo**: PDF para empleados

### **Contabilidad** (`/accounting`)
- **Libro Diario**: Asientos manuales y automáticos (desde documentos)
- **Libro Mayor**: Saldos por cuenta contable
- **Plan de Cuentas**: Personalizable por empresa
- **Asientos automáticos con IA**: La IA genera asientos desde comprobantes aprobados

### **Tesorería** (`/treasury`)
- Registro de cobros y pagos
- Flujo de fondos proyectado
- **Conciliación Bancaria con IA**:
  - Importás extracto bancario (CSV/Excel)
  - La IA confronta con comprobantes y asientos
  - Detecta diferencias y movimientos sin conciliar
  - Marcás como conciliado manualmente

### **Reportes Financieros** (`/financial-reports`)
- **Balance de Comprobación**: Saldos por cuenta
- **Estado de Resultados**: Ganancias y pérdidas
- **Balance General**: Activo, pasivo, patrimonio
- **Libro IVA Digital**: Exportación .txt compatible AFIP (Compras/Ventas)

### **Societario** (`/corporate`)
- Actas de directorio y asambleas
- Libros societarios (Diario, Inventario, Actas)
- Estatutos y modificaciones
- Borradores con IA para actas tipo

### **Agentes de IA** (`/agents`)
- **Agente Contable**: Consultas sobre asientos, balances, NIIF
- **Agente ARCA**: Normativa de AFIP, procedimientos, VEP
- **Agente Laboral**: Sueldos, convenios, cargas sociales
- **Agente Documental**: Clasificación y validación de comprobantes
- **Agente Fiscal**: Cálculo de impuestos, vencimientos, percepciones

### **Asistente IA** (`/ai-assistant`)
- Chat con IA especializada en normativa argentina
- Consultas técnicas sobre:
  - IVA, IIBB, Ganancias, Bienes Personales
  - Procedimientos de AFIP
  - Ley de Contrato de Trabajo
  - NIIF y normas contables

### **Motor Normativo** (`/normativa`)
- Actualizaciones de resoluciones generales, decretos, leyes
- Impacto por área tributaria
- Análisis de IA sobre cambios normativos

### **Auditoría & Logs** (`/audit`)
- Logs de todas las operaciones del sistema
- Trazabilidad completa: quién, qué, cuándo
- Exportación de auditoría
- Filtros por usuario, módulo, fecha

### **Portal del Cliente** (`/portal`)
- Vista exclusiva para cada contribuyente
- Solo ve sus documentos, DDJJ, facturas
- Descarga de recibos y declaraciones
- Comunicación con el estudio

---

## 👥 Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **SuperAdmin** | Acceso total a todas las empresas y funciones |
| **Estudio Contable** | Gestión completa multi-empresa |
| **Contador** | Operaciones contables/impositivas (crear, editar, aprobar) |
| **Liquidador** | Sueldos, facturación, documentos |
| **Administrativo** | Tareas, documentos, clientes básicos |
| **Auditor** | Solo lectura + logs de auditoría |
| **RRHH** | Sueldos y empleados |
| **Cliente** | Portal propio (solo sus datos, lectura) |

---

## 🔐 Seguridad y Aislamiento

- **Aislamiento por empresa**: Cada empresa ve solo sus datos
- **Multi-sucursal**: Soporte para casas centrales y sucursales
- **Roles granulares**: Permisos específicos por módulo
- **Logs de auditoría**: Trazabilidad completa de operaciones
- **Backup automático**: Datos protegidos y versionados

---

## 📊 Vencimientos y Calendario Fiscal

- **Calendario automático**: La IA genera vencimientos según tipo de contribuyente
- **Alertas proactivas**: Notificaciones por email y en plataforma
- **Estado de obligaciones**: Pendiente, en progreso, completada, vencida
- **Filtros por período**: Mes, trimestre, anual

---

## 🧠 Inteligencia Artificial

### **Clasificación Documental**
- Detecta tipo de comprobante (factura A/B/C, nota de crédito, recibo)
- Extrae datos: fecha, monto, IVA, CUIT, CAE
- Sugiere cuenta contable para el asiento

### **Cálculo de Impuestos**
- IVA: Débito vs. crédito fiscal
- IIBB: Coeficientes por jurisdicción
- Ganancias: Escalas y mínimos no imponibles
- Bienes Personales: Valuación de activos

### **Conciliación Bancaria**
- Confronta extracto bancario con comprobantes
- Detecta matches probables
- Marca diferencias para revisión manual

### **Generación de Actas**
- Borradores de actas de directorio y asamblea
- Resoluciones tipo según necesidad
- Adaptadas al marco legal vigente

---

## 📞 Soporte

- **Email**: soporte@contaia.com
- **WhatsApp**: +54 9 11 1234-5678
- **Horario**: Lunes a Viernes 9:00 - 18:00 ART
- **Centro de Ayuda**: Botón `?` en el dashboard

---

## 🎯 Próximas Funcionalidades

- Integración directa con AFIP (CAE, VEP, DDJJ)
- Presentación automática de declaraciones juradas
- Cálculo de percepciones y retenciones
- Integración con bancos para conciliación automática
- App móvil para notificaciones y aprobaciones

---

## 💡 Consejos de Uso

1. **Cargá documentos todos los días**: La IA clasifica más rápido con volumen
2. **Revisá la Bandeja de Revisión**: Documentos pendientes de aprobación
3. **Configurá alertas de vencimientos**: No pierdas ningún plazo de AFIP
4. **Usá los Agentes de IA**: Responden consultas técnicas en segundos
5. **Exportá libros IVA mensualmente**: Tené backup local de tus DDJJ

---

**¡Bienvenido a ContaIA! Tu estudio contable, potenciado con IA.** 🚀