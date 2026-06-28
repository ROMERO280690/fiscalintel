/**
 * Sistema de Roles y Permisos — ContaIA
 *
 * Roles:
 *   super_admin       → SuperAdministrador (acceso total)
 *   empresa           → Empresa (ve sus propios datos)
 *   estudio_contable  → Estudio Contable (gestión multi-cliente)
 *   contador          → Contador (operaciones contables/impositivas)
 *   auditor           → Auditor (solo lectura + logs)
 *   liquidador        → Liquidador (sueldos y facturación)
 *   administrativo    → Administrativo (tareas, documentos, clientes básicos)
 *   cliente           → Cliente (portal propio, solo lectura)
 *   rrhh              → RRHH (sueldos y empleados)
 *
 * Módulos (= rutas):
 *   dashboard, review, gemelo_fiscal, clients, tasks,
 *   documents, invoicing, tax_filings, iibb, tax_calendar,
 *   payroll, accounting, treasury, corporate,
 *   agents, ai_assistant, normativa,
 *   account_plan, audit, portal
 *
 * Acciones: view | create | edit | delete | approve | ai_run | export
 */

// ─── Mapa de módulos a ruta ──────────────────────────────────────────────────
export const MODULE_ROUTES = {
  dashboard:     "/",
  review:        "/review",
  gemelo_fiscal: "/gemelo-fiscal",
  clients:       "/clients",
  tasks:         "/tasks",
  documents:     "/documents",
  invoicing:     "/invoicing",
  tax_filings:   "/tax-filings",
  iibb:          "/iibb-convenio",
  tax_calendar:  "/tax-calendar",
  payroll:       "/payroll",
  accounting:    "/accounting",
  treasury:      "/treasury",
  financial_reports: "/financial-reports",
  bank_reconciliation: "/bank-reconciliation",
  corporate:     "/corporate",
  agents:        "/agents",
  ai_assistant:  "/ai-assistant",
  normativa:     "/normativa",
  account_plan:  "/account-plan",
  audit:         "/audit",
  portal:        "/portal",
  financial_reports: "/financial-reports",
};

// ─── Permisos por rol ────────────────────────────────────────────────────────
// Formato: { [módulo]: { actions: string[], dataScope: "all"|"own"|"none" } }

const ALL_ACTIONS = ["view", "create", "edit", "delete", "approve", "ai_run", "export"];
const READ_ONLY   = ["view", "export"];
const STANDARD    = ["view", "create", "edit", "export"];

const ROLE_PERMISSIONS = {

  // ── SuperAdministrador ─────────────────────────────────────────────────────
  super_admin: {
    dashboard:     { actions: ALL_ACTIONS, dataScope: "all" },
    review:        { actions: ALL_ACTIONS, dataScope: "all" },
    gemelo_fiscal: { actions: ALL_ACTIONS, dataScope: "all" },
    clients:       { actions: ALL_ACTIONS, dataScope: "all" },
    tasks:         { actions: ALL_ACTIONS, dataScope: "all" },
    documents:     { actions: ALL_ACTIONS, dataScope: "all" },
    invoicing:     { actions: ALL_ACTIONS, dataScope: "all" },
    tax_filings:   { actions: ALL_ACTIONS, dataScope: "all" },
    iibb:          { actions: ALL_ACTIONS, dataScope: "all" },
    tax_calendar:  { actions: ALL_ACTIONS, dataScope: "all" },
    payroll:       { actions: ALL_ACTIONS, dataScope: "all" },
    accounting:    { actions: ALL_ACTIONS, dataScope: "all" },
    treasury:      { actions: ALL_ACTIONS, dataScope: "all" },
    financial_reports: { actions: ALL_ACTIONS, dataScope: "all" },
    bank_reconciliation: { actions: ALL_ACTIONS, dataScope: "all" },
    corporate:     { actions: ALL_ACTIONS, dataScope: "all" },
    agents:        { actions: ALL_ACTIONS, dataScope: "all" },
    ai_assistant:  { actions: ALL_ACTIONS, dataScope: "all" },
    normativa:     { actions: ALL_ACTIONS, dataScope: "all" },
    account_plan:  { actions: ALL_ACTIONS, dataScope: "all" },
    audit:         { actions: ALL_ACTIONS, dataScope: "all" },
    portal:        { actions: ALL_ACTIONS, dataScope: "all" },
    financial_reports: { actions: ALL_ACTIONS, dataScope: "all" },
  },

  // ── Empresa ───────────────────────────────────────────────────────────────
  // Ve solo sus propios datos; sin auditoría ni plan de cuentas
  empresa: {
    dashboard:     { actions: READ_ONLY,  dataScope: "own" },
    review:        { actions: READ_ONLY,  dataScope: "own" },
    gemelo_fiscal: { actions: READ_ONLY,  dataScope: "own" },
    clients:       { actions: READ_ONLY,  dataScope: "own" },
    tasks:         { actions: READ_ONLY,  dataScope: "own" },
    documents:     { actions: READ_ONLY,  dataScope: "own" },
    invoicing:     { actions: READ_ONLY,  dataScope: "own" },
    tax_filings:   { actions: READ_ONLY,  dataScope: "own" },
    iibb:          { actions: READ_ONLY,  dataScope: "own" },
    tax_calendar:  { actions: READ_ONLY,  dataScope: "own" },
    payroll:       { actions: READ_ONLY,  dataScope: "own" },
    accounting:    { actions: READ_ONLY,  dataScope: "own" },
    treasury:      { actions: READ_ONLY,  dataScope: "own" },
    financial_reports: { actions: READ_ONLY, dataScope: "own" },
    bank_reconciliation: { actions: READ_ONLY, dataScope: "own" },
    corporate:     { actions: READ_ONLY,  dataScope: "own" },
    agents:        { actions: ["view"],   dataScope: "own" },
    ai_assistant:  { actions: ["view"],   dataScope: "own" },
    normativa:     { actions: READ_ONLY,  dataScope: "own" },
    account_plan:  { actions: [],         dataScope: "none" },
    audit:         { actions: [],         dataScope: "none" },
    portal:        { actions: ALL_ACTIONS,dataScope: "own" },
    financial_reports: { actions: READ_ONLY, dataScope: "own" },
  },

  // ── Estudio Contable ──────────────────────────────────────────────────────
  estudio_contable: {
    dashboard:     { actions: ALL_ACTIONS, dataScope: "all" },
    review:        { actions: ALL_ACTIONS, dataScope: "all" },
    gemelo_fiscal: { actions: ALL_ACTIONS, dataScope: "all" },
    clients:       { actions: ALL_ACTIONS, dataScope: "all" },
    tasks:         { actions: ALL_ACTIONS, dataScope: "all" },
    documents:     { actions: ALL_ACTIONS, dataScope: "all" },
    invoicing:     { actions: ALL_ACTIONS, dataScope: "all" },
    tax_filings:   { actions: ALL_ACTIONS, dataScope: "all" },
    iibb:          { actions: ALL_ACTIONS, dataScope: "all" },
    tax_calendar:  { actions: ALL_ACTIONS, dataScope: "all" },
    payroll:       { actions: ALL_ACTIONS, dataScope: "all" },
    accounting:    { actions: ALL_ACTIONS, dataScope: "all" },
    treasury:      { actions: ALL_ACTIONS, dataScope: "all" },
    financial_reports: { actions: ALL_ACTIONS, dataScope: "all" },
    bank_reconciliation: { actions: ALL_ACTIONS, dataScope: "all" },
    corporate:     { actions: ALL_ACTIONS, dataScope: "all" },
    agents:        { actions: ALL_ACTIONS, dataScope: "all" },
    ai_assistant:  { actions: ALL_ACTIONS, dataScope: "all" },
    normativa:     { actions: ALL_ACTIONS, dataScope: "all" },
    account_plan:  { actions: ALL_ACTIONS, dataScope: "all" },
    audit:         { actions: READ_ONLY,   dataScope: "all" },
    portal:        { actions: ALL_ACTIONS, dataScope: "all" },
    financial_reports: { actions: ALL_ACTIONS, dataScope: "all" },
  },

  // ── Contador ──────────────────────────────────────────────────────────────
  contador: {
    dashboard:     { actions: STANDARD,                       dataScope: "all" },
    review:        { actions: [...STANDARD, "approve"],       dataScope: "all" },
    gemelo_fiscal: { actions: [...STANDARD, "ai_run"],        dataScope: "all" },
    clients:       { actions: [...STANDARD, "delete"],        dataScope: "all" },
    tasks:         { actions: ALL_ACTIONS,                    dataScope: "all" },
    documents:     { actions: [...STANDARD, "approve"],       dataScope: "all" },
    invoicing:     { actions: [...STANDARD, "approve"],       dataScope: "all" },
    tax_filings:   { actions: [...STANDARD, "approve", "ai_run"], dataScope: "all" },
    iibb:          { actions: [...STANDARD, "approve"],       dataScope: "all" },
    tax_calendar:  { actions: STANDARD,                       dataScope: "all" },
    payroll:       { actions: [...STANDARD, "approve"],       dataScope: "all" },
    accounting:    { actions: [...STANDARD, "approve", "ai_run"], dataScope: "all" },
    treasury:      { actions: STANDARD,                       dataScope: "all" },
    financial_reports: { actions: [...STANDARD, "export"],    dataScope: "all" },
    bank_reconciliation: { actions: [...STANDARD, "ai_run"],  dataScope: "all" },
    corporate:     { actions: [...STANDARD, "approve"],       dataScope: "all" },
    agents:        { actions: [...STANDARD, "ai_run"],        dataScope: "all" },
    ai_assistant:  { actions: [...STANDARD, "ai_run"],        dataScope: "all" },
    normativa:     { actions: STANDARD,                       dataScope: "all" },
    account_plan:  { actions: STANDARD,                       dataScope: "all" },
    audit:         { actions: READ_ONLY,                      dataScope: "all" },
    portal:        { actions: STANDARD,                       dataScope: "all" },
    financial_reports: { actions: [...STANDARD, "export"],    dataScope: "all" },
  },

  // ── Auditor ───────────────────────────────────────────────────────────────
  // Solo lectura en todo, acceso completo a auditoría
  auditor: {
    dashboard:     { actions: READ_ONLY, dataScope: "all" },
    review:        { actions: READ_ONLY, dataScope: "all" },
    gemelo_fiscal: { actions: READ_ONLY, dataScope: "all" },
    clients:       { actions: READ_ONLY, dataScope: "all" },
    tasks:         { actions: READ_ONLY, dataScope: "all" },
    documents:     { actions: READ_ONLY, dataScope: "all" },
    invoicing:     { actions: READ_ONLY, dataScope: "all" },
    tax_filings:   { actions: READ_ONLY, dataScope: "all" },
    iibb:          { actions: READ_ONLY, dataScope: "all" },
    tax_calendar:  { actions: READ_ONLY, dataScope: "all" },
    payroll:       { actions: READ_ONLY, dataScope: "all" },
    accounting:    { actions: READ_ONLY, dataScope: "all" },
    treasury:      { actions: READ_ONLY, dataScope: "all" },
    financial_reports: { actions: READ_ONLY, dataScope: "all" },
    bank_reconciliation: { actions: READ_ONLY, dataScope: "all" },
    corporate:     { actions: READ_ONLY, dataScope: "all" },
    agents:        { actions: [],        dataScope: "none" },
    ai_assistant:  { actions: READ_ONLY, dataScope: "all" },
    normativa:     { actions: READ_ONLY, dataScope: "all" },
    account_plan:  { actions: READ_ONLY, dataScope: "all" },
    audit:         { actions: [...READ_ONLY, "export"], dataScope: "all" },
    portal:        { actions: [],        dataScope: "none" },
    financial_reports: { actions: READ_ONLY, dataScope: "all" },
  },

  // ── Liquidador ────────────────────────────────────────────────────────────
  // Sueldos, facturación, documentos; sin societario ni auditoría
  liquidador: {
    dashboard:     { actions: READ_ONLY,                dataScope: "all" },
    review:        { actions: READ_ONLY,                dataScope: "all" },
    gemelo_fiscal: { actions: [],                       dataScope: "none" },
    clients:       { actions: READ_ONLY,                dataScope: "all" },
    tasks:         { actions: STANDARD,                 dataScope: "all" },
    documents:     { actions: STANDARD,                 dataScope: "all" },
    invoicing:     { actions: [...STANDARD, "approve"], dataScope: "all" },
    tax_filings:   { actions: READ_ONLY,                dataScope: "all" },
    iibb:          { actions: [],                       dataScope: "none" },
    tax_calendar:  { actions: READ_ONLY,                dataScope: "all" },
    payroll:       { actions: [...STANDARD, "approve", "ai_run"], dataScope: "all" },
    accounting:    { actions: READ_ONLY,                dataScope: "all" },
    treasury:      { actions: STANDARD,                 dataScope: "all" },
    financial_reports: { actions: READ_ONLY,            dataScope: "all" },
    bank_reconciliation: { actions: READ_ONLY,          dataScope: "all" },
    corporate:     { actions: [],                       dataScope: "none" },
    agents:        { actions: ["view"],                 dataScope: "all" },
    ai_assistant:  { actions: ["view", "ai_run"],       dataScope: "all" },
    normativa:     { actions: READ_ONLY,                dataScope: "all" },
    account_plan:  { actions: [],                       dataScope: "none" },
    audit:         { actions: [],                       dataScope: "none" },
    portal:        { actions: READ_ONLY,                dataScope: "all" },
    financial_reports: { actions: READ_ONLY,            dataScope: "all" },
  },

  // ── Administrativo ────────────────────────────────────────────────────────
  administrativo: {
    dashboard:     { actions: READ_ONLY, dataScope: "all" },
    review:        { actions: READ_ONLY, dataScope: "all" },
    gemelo_fiscal: { actions: [],        dataScope: "none" },
    clients:       { actions: STANDARD,  dataScope: "all" },
    tasks:         { actions: ALL_ACTIONS, dataScope: "all" },
    documents:     { actions: STANDARD,  dataScope: "all" },
    invoicing:     { actions: STANDARD,  dataScope: "all" },
    tax_filings:   { actions: READ_ONLY, dataScope: "all" },
    iibb:          { actions: [],        dataScope: "none" },
    tax_calendar:  { actions: READ_ONLY, dataScope: "all" },
    payroll:       { actions: READ_ONLY, dataScope: "all" },
    accounting:    { actions: READ_ONLY, dataScope: "all" },
    treasury:      { actions: READ_ONLY, dataScope: "all" },
    financial_reports: { actions: READ_ONLY, dataScope: "all" },
    bank_reconciliation: { actions: READ_ONLY, dataScope: "all" },
    corporate:     { actions: READ_ONLY, dataScope: "all" },
    agents:        { actions: ["view"],  dataScope: "all" },
    ai_assistant:  { actions: ["view"],  dataScope: "all" },
    normativa:     { actions: READ_ONLY, dataScope: "all" },
    account_plan:  { actions: [],        dataScope: "none" },
    audit:         { actions: [],        dataScope: "none" },
    portal:        { actions: READ_ONLY, dataScope: "all" },
    financial_reports: { actions: READ_ONLY, dataScope: "all" },
  },

  // ── Cliente ───────────────────────────────────────────────────────────────
  // Solo portal y documentos propios
  cliente: {
    dashboard:     { actions: READ_ONLY, dataScope: "own" },
    review:        { actions: [],        dataScope: "none" },
    gemelo_fiscal: { actions: [],        dataScope: "none" },
    clients:       { actions: [],        dataScope: "none" },
    tasks:         { actions: [],        dataScope: "none" },
    documents:     { actions: READ_ONLY, dataScope: "own" },
    invoicing:     { actions: READ_ONLY, dataScope: "own" },
    tax_filings:   { actions: READ_ONLY, dataScope: "own" },
    iibb:          { actions: [],        dataScope: "none" },
    tax_calendar:  { actions: READ_ONLY, dataScope: "own" },
    payroll:       { actions: [],        dataScope: "none" },
    accounting:    { actions: [],        dataScope: "none" },
    treasury:      { actions: [],        dataScope: "none" },
    financial_reports: { actions: [],    dataScope: "none" },
    bank_reconciliation: { actions: [],  dataScope: "none" },
    corporate:     { actions: [],        dataScope: "none" },
    agents:        { actions: [],        dataScope: "none" },
    ai_assistant:  { actions: [],        dataScope: "none" },
    normativa:     { actions: [],        dataScope: "none" },
    account_plan:  { actions: [],        dataScope: "none" },
    audit:         { actions: [],        dataScope: "none" },
    portal:        { actions: ALL_ACTIONS, dataScope: "own" },
  },

  // ── RRHH ──────────────────────────────────────────────────────────────────
  rrhh: {
    dashboard:     { actions: READ_ONLY,                dataScope: "all" },
    review:        { actions: READ_ONLY,                dataScope: "all" },
    gemelo_fiscal: { actions: [],                       dataScope: "none" },
    clients:       { actions: READ_ONLY,                dataScope: "all" },
    tasks:         { actions: STANDARD,                 dataScope: "all" },
    documents:     { actions: STANDARD,                 dataScope: "all" },
    invoicing:     { actions: [],                       dataScope: "none" },
    tax_filings:   { actions: [],                       dataScope: "none" },
    iibb:          { actions: [],                       dataScope: "none" },
    tax_calendar:  { actions: READ_ONLY,                dataScope: "all" },
    payroll:       { actions: [...STANDARD, "approve", "ai_run"], dataScope: "all" },
    accounting:    { actions: [],                       dataScope: "none" },
    treasury:      { actions: [],                       dataScope: "none" },
    corporate:     { actions: READ_ONLY,                dataScope: "all" },
    agents:        { actions: ["view"],                 dataScope: "all" },
    ai_assistant:  { actions: ["view", "ai_run"],       dataScope: "all" },
    normativa:     { actions: READ_ONLY,                dataScope: "all" },
    account_plan:  { actions: [],                       dataScope: "none" },
    audit:         { actions: [],                       dataScope: "none" },
    portal:        { actions: READ_ONLY,                dataScope: "all" },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normaliza el role del usuario al key interno.
 * Base44 almacena role como "admin" o "user"; los roles custom se guardan en user.role.
 * Mapeamos también los strings de Base44 por compatibilidad.
 */
export function normalizeRole(userRole) {
  const map = {
    admin:            "super_admin",
    user:             "contador",      // fallback seguro
    super_admin:      "super_admin",
    empresa:          "empresa",
    estudio_contable: "estudio_contable",
    contador:         "contador",
    auditor:          "auditor",
    liquidador:       "liquidador",
    administrativo:   "administrativo",
    cliente:          "cliente",
    rrhh:             "rrhh",
  };
  return map[userRole] || "cliente";
}

/** Devuelve el objeto de permisos del módulo para el rol dado. */
export function getModulePermissions(userRole, module) {
  const role = normalizeRole(userRole);
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return { actions: [], dataScope: "none" };
  return perms[module] || { actions: [], dataScope: "none" };
}

/** ¿Puede el usuario ver (acceder) al módulo? */
export function canView(userRole, module) {
  const { actions } = getModulePermissions(userRole, module);
  return actions.includes("view");
}

/** ¿Puede ejecutar una acción específica en un módulo? */
export function canDo(userRole, module, action) {
  const { actions } = getModulePermissions(userRole, module);
  return actions.includes(action);
}

/** ¿Cuál es el alcance de datos? "all" | "own" | "none" */
export function getDataScope(userRole, module) {
  return getModulePermissions(userRole, module).dataScope;
}

/** Lista de módulos accesibles para el nav sidebar */
export function getAccessibleModules(userRole) {
  const role = normalizeRole(userRole);
  const perms = ROLE_PERMISSIONS[role] || {};
  return Object.entries(perms)
    .filter(([, p]) => p.actions.includes("view"))
    .map(([mod]) => mod);
}

/** Etiqueta display del rol */
export const ROLE_LABELS = {
  super_admin:      "SuperAdministrador",
  empresa:          "Empresa",
  estudio_contable: "Estudio Contable",
  contador:         "Contador",
  auditor:          "Auditor",
  liquidador:       "Liquidador",
  administrativo:   "Administrativo",
  cliente:          "Cliente",
  rrhh:             "RRHH",
};