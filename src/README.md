# 🚀 CONTAIA - Sistema de Gestión para Estudios Contables

**ERP Contable Inteligente con IA para Argentina**

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Características Principales](#características-principales)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Roles y Permisos](#roles-y-permisos)
7. [Integración con ARCA/AFIP](#integración-con-arcaafip)
8. [Backup y Seguridad](#backup-y-seguridad)
9. [Soporte Técnico](#soporte-técnico)

---

## 📖 Introducción

**ContaIA** es un sistema ERP completo diseñado específicamente para estudios contables argentinos de vanguardia. Combina gestión contable tradicional con inteligencia artificial para automatizar tareas repetitivas y brindar insights profesionales.

### ✅ ¿Qué podés hacer con ContaIA?

- **Facturación Electrónica** con conexión directa a ARCA/AFIP
- **Liquidación de Sueldos** y F931 automático
- **DDJJ** (IVA, Ganancias, IIBB, Sociedades)
- **Contabilidad Completa** (Diario, Mayor, Balances)
- **Tesorería y Conciliación Bancaria** automática con IA
- **Portal del Cliente** para que tus clientes vean su situación
- **Agentes IA Especializados** para cada área contable
- **Backup Automático** semanal de toda tu base de datos

---

## ⚡ Características Principales

### 🤖 Inteligencia Artificial Integrada

- **Clasificación Automática de Documentos**: La IA lee facturas y las clasifica
- **Conciliación Bancaria**: Cruza movimientos bancarios con comprobantes
- **Asistente Fiscal IA**: Responde consultas de clientes en lenguaje natural
- **Agentes Especializados**: 8 agentes IA para áreas específicas (IVA, Sueldos, ARCA, etc.)

### 🏢 Multi-Empresa y Multi-Usuario

- Gestión ilimitada de empresas/clientes
- Sucursales múltiples por empresa
- Roles granulares (SuperAdmin, Estudio, Contador, Auditor, Liquidador, etc.)
- Aislamiento completo de datos entre empresas

### 📊 Reportes Profesionales

- Balance General
- Estado de Resultados (PyG)
- Flujo de Fondos
- Libros Contables (Diario, Mayor, IVA)
- Exportación a PDF, Excel y TXT AFIP

---

## 💻 Requisitos del Sistema

### Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Conexión a Internet

- Requerida para operación normal
- 5 Mbps mínimo recomendado

### Dispositivos

- Desktop, Laptop, Tablet
- Responsive design (mobile-friendly)

---

## 🛠️ Instalación y Configuración

### Paso 1: Crear Cuenta

1. Ingresá a [tu URL de ContaIA]
2. Hacé clic en "Registrarse"
3. Completá el formulario con tus datos
4. Verificá tu email

### Paso 2: Configurar Organización

1. Completá el asistente de onboarding
2. Creá tu organización/estudio contable
3. Configurá tu primera empresa/cliente
4. Invitá a tu equipo (opcional)

### Paso 3: Configurar Certificados ARCA/AFIP

**IMPORTANTE**: Para habilitar facturación electrónica necesitás:

1. **Certificado Digital (.pem)**: Obtenelo desde [AFIP](https://www.afip.gob.ar)
2. **Clave Privada (.pem)**: La generaste al crear el certificado
3. **Clave Fiscal Nivel 3**: Con servicios WSFE, WSFEX habilitados

**Pasos:**

1. Andá a **Configuración > Certificados ARCA/AFIP**
2. Subí tu certificado .pem
3. Subí tu clave privada .pem
4. Ingresá tu Clave Fiscal
5. Andá a **Dashboard > Settings > Secrets**
6. Creá las variables:
   - `ARCA_CERT_PEM` (contenido del certificado)
   - `ARCA_KEY_PEM` (contenido de la clave privada)
   - `ARCA_TAX_KEY` (tu clave fiscal)
7. Reiniciá la aplicación
8. Probá la conexión con el botón "Probar Conexión ARCA"

### Paso 4: Configurar Backup Automático

El backup se ejecuta automáticamente todos los domingos a las 3:00 AM.

Para ejecutar un backup manual:

1. Andá a **Configuración > Backup y Seguridad**
2. Hacé clic en "Backup Ahora"
3. El backup se guarda en storage privado

---

## 📦 Módulos del Sistema

### Dashboard

Vista principal con:
- KPIs del día
- Vencimientos próximos
- Tareas pendientes
- Actividad reciente

### Clientes

Gestión completa de clientes:
- Alta, baja, modificación
- Categorización (Monotributista, RI, etc.)
- Datos fiscales completos
- Historial de operaciones

### Tareas

Seguimiento de actividades:
- Tareas por cliente
- Estados (Pendiente, En Progreso, Completada)
- Prioridades y vencimientos
- Asignación a miembros del equipo

### Documentos (Expediente Digital)

Gestión documental con IA:
- Upload de archivos (PDF, imágenes)
- Clasificación automática con IA
- Extracción de datos (fecha, monto, CUIT)
- Estados (Cargado, Procesando, Clasificado, Aprobado)

### Facturación Electrónica

Emisión de comprobantes:
- Facturas A, B, C, M, E
- Notas de Crédito y Débito
- Cálculo automático de impuestos
- **CAE automático** mediante ARCA
- PDF con código QR (RG 4744/2020)

### DDJJ (Impuestos)

Declaraciones Juradas:
- IVA (Compras y Ventas)
- Ganancias
- IIBB (Local y Convenio Multilateral)
- Monotributo
- Bienes Personales
- Cálculo con IA basado en documentos

### Sueldos (Liquidación)

Liquidación de remuneraciones:
- Empleados múltiples
- Cálculo automático de:
  - Sueldo bruto
  - Jubilación (11%)
  - Obra Social (3%)
  - PAMI (1.5%)
  - Sindicato (según convenio)
- F931 automático
- Recibos de sueldo en PDF

### Contabilidad

Libros contables digitales:
- **Libro Diario**: Asientos ordenados por fecha
- **Libro Mayor**: Movimientos por cuenta
- **Balances**: Activo, Pasivo, Patrimonio
- Exportación a formato AFIP

### Tesorería

Gestión de caja y bancos:
- Ingresos y egresos
- Cuentas bancarias múltiples
- **Conciliación Automática con IA**
- Extractos bancarios (importación CSV)

### IIBB & Convenio Multilateral

Liquidación provincial:
- Coeficientes por provincia
- CM03 y CM05
- Cálculo automático con IA
- Alícuotas actualizadas

### Societario

Actas y libros societarios:
- Actas de Directorio
- Actas de Asamblea
- Estatutos
- Poderes
- Borradores automáticos con IA

### Agentes IA

8 agentes especializados:

1. **Agente Documental**: Clasifica documentos
2. **Agente Contable**: Genera asientos
3. **Agente IVA**: Calcula impuesto
4. **Agente Laboral**: Liquidación sueldos
5. **Agente ARCA**: Facturación electrónica
6. **Agente Auditor**: Revisión de operaciones
7. **Agente Financiero**: Reportes y balances
8. **Agente Normativo**: Actualizaciones AFIP

### Vencimientos

Calendario fiscal:
- Vencimientos por cliente
- Alertas automáticas (email + in-app)
- Recordatorios a 15, 7, 3 y 1 día
- Integración con calendario

### Plan de Cuentas

Estructura contable:
- Cuentas personalizadas
- Niveles y subcuentas
- Tipos (Activo, Pasivo, Patrimonio, etc.)
- Exportación/importación

### Auditoría

Logs de actividad:
- Todas las operaciones registradas
- Usuario, fecha, IP
- Entidad afectada
- Cambios realizados

### Portal del Cliente

Acceso para tus clientes:
- Situación fiscal resumida
- DDJJ presentadas
- Documentos aprobados
- Vencimientos
- **Chat con IA** para consultas

---

## 👥 Roles y Permisos

### SuperAdministrador

- Acceso total a todo
- Puede crear organizaciones
- Ve todas las empresas

### Estudio Contable

- Gestión completa de múltiples clientes
- Todos los módulos habilitados
- Acceso a configuración ARCA

### Contador

- Operaciones contables diarias
- Todos los módulos operativos
- Sin acceso a configuración del sistema

### Auditor

- Solo lectura en todos los módulos
- Acceso completo a Auditoría y Logs
- Puede exportar reportes

### Liquidador

- Sueldos y F931
- Facturación
- Documentos
- Sin acceso a Contabilidad avanzada

### Administrativo

- Tareas y Documentos
- Clientes básicos
- Facturación operativa
- Sin acceso a impuestos avanzados

### RRHH

- Sueldos y Empleados
- Tareas relacionadas
- Sin acceso a contabilidad

### Cliente

- Portal exclusivo (solo lectura)
- Ve solo sus propios datos
- Chat con IA para consultas

---

## 🔌 Integración con ARCA/AFIP

### Servicios Habilitados

| Servicio | Código | Descripción |
|----------|--------|-------------|
| WSFE | 1 | Facturación Electrónica |
| WSFEX | 2 | Facturación de Exportación |
| F931 | 3 | Liquidación de Sueldos |
| Libro Digital | 4 | Libros IVA/Contables |
| Consulta CUIT | 5 | Validación de contribuyentes |

### Pasos para Homologar

1. **Obtener Certificado Digital**
   - Ingresá a [AFIP](https://www.afip.gob.ar)
   - Clave Fiscal Nivel 3
   - Generar certificado para "Servicios Web"
   - Descargar .pem y clave privada

2. **Configurar en ContaIA**
   - Ir a Configuración > Certificados ARCA
   - Subir ambos archivos .pem
   - Ingresar Clave Fiscal
   - Guardar en Secrets del dashboard

3. **Probar Conexión**
   - Botón "Probar Conexión ARCA"
   - Debe mostrar "Conexión exitosa"
   - Si falla, verificar certificado vigente

### Troubleshooting

**Error: "Certificado expirado"**
- Renová el certificado en AFIP
- Volvé a subir el nuevo .pem

**Error: "Clave fiscal inválida"**
- Verificá que tenga Nivel 3
- Controlá que tenga WSFE habilitado
- Revisá que no esté bloqueada

**Error: "Timeout de conexión"**
- Verificá conexión a internet
- Esperá 5 minutos y reintentá
- Si persiste, contactá a soporte

---

## 🔒 Backup y Seguridad

### Backup Automático

- **Frecuencia**: Semanal (domingos 3:00 AM)
- **Contenido**: Todas las entidades
- **Ubicación**: Storage privado encriptado
- **Retención**: Últimos 12 backups

### Backup Manual

Podés ejecutar un backup en cualquier momento:

1. Ir a Configuración > Backup y Seguridad
2. Clic en "Backup Ahora"
3. Se genera archivo JSON con todos los datos
4. Se guarda en storage privado

### Restaurar Backup

**IMPORTANTE**: La restauración solo puede hacerla el equipo de soporte.

Contactar a soporte con:
- Nombre del backup a restaurar
- Justificación de la restauración
- Usuario autorizado

### Seguridad de Datos

- **Encriptación**: TLS 1.3 en tránsito
- **Autenticación**: JWT con refresh tokens
- **Autorización**: Roles y permisos granulares
- **Auditoría**: Logs inmutables de todas las operaciones
- **Aislamiento**: Multi-empresa con separación estricta

---

## 📞 Soporte Técnico

### Horarios de Atención

- **Lunes a Viernes**: 9:00 - 18:00 (Argentina)
- **Sábados**: 9:00 - 13:00 (solo emergencias)
- **Domingos y Feriados**: Cerrado

### Canales de Contacto

**Email**: soporte@contaia.com.ar

**Teléfono**: +54 11 1234-5678

**WhatsApp**: +54 9 11 1234-5678

**Formulario Web**: [contaia.com.ar/soporte](https://contaia.com.ar/soporte)

### Tiempos de Respuesta

| Prioridad | Tiempo | Ejemplo |
|-----------|--------|---------|
| Crítica | 2 horas | Sistema caído |
| Alta | 4 horas | Error en facturación |
| Media | 24 horas | Consulta funcional |
| Baja | 48 horas | Sugerencia de mejora |

### Antes de Contactar Soporte

1. **Revisá la documentación** (este README)
2. **Buscá en el Help Center** dentro del sistema
3. **Verificá tu conexión a internet**
4. **Probá en otro navegador**
5. **Limpiá caché del navegador**

Si el problema persiste, contactanos proveyendo:

- Captura de pantalla del error
- Navegador y versión que usás
- Paso a paso para reproducir el error
- Usuario con el que estás operando

---

## 📄 Licencia y Términos

© 2026 ContaIA. Todos los derechos reservados.

El uso de este sistema está sujeto a los [Términos y Condiciones](https://contaia.com.ar/terminos) y [Política de Privacidad](https://contaia.com.ar/privacidad).

---

## 🎯 Próximas Actualizaciones

**Q3 2026**:
- [ ] Integración bancaria directa (Home Banking API)
- [ ] Teledeclaración Jurada automática
- [ ] App móvil iOS/Android
- [ ] API pública para integraciones

**Q4 2026**:
- [ ] Módulo de Presupuesto y Forecasting
- [ ] BI Dashboard con Power BI integration
- [ ] Facturación masiva (lotes)
- [ ] Multi-moneda (USD, EUR)

---

**¡Gracias por usar ContaIA!** 🚀

*Desarrollado en Argentina para el mundo*