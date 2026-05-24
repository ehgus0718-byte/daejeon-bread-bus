function createAuditId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSafeText(value) {
  return String(value ?? "").trim();
}

export function createAdminAuditLog({
  action = "",
  targetType = "",
  targetId = "",
  beforeValue = null,
  afterValue = null,
  actor = "admin"
} = {}) {
  return {
    id: createAuditId(),
    action: toSafeText(action),
    targetType: toSafeText(targetType),
    targetId: toSafeText(targetId),
    beforeValue,
    afterValue,
    actor: toSafeText(actor) || "admin",
    createdAt: new Date().toISOString()
  };
}

export function appendAdminAuditLog({ auditLogs = [], log } = {}) {
  if (!log) {
    return auditLogs;
  }

  return [log, ...auditLogs];
}

export function filterAdminAuditLogsByTarget({
  auditLogs = [],
  targetType = "",
  targetId = ""
} = {}) {
  return auditLogs.filter((log) => {
    const typeMatched = targetType ? log.targetType === targetType : true;
    const idMatched = targetId ? log.targetId === targetId : true;
    return typeMatched && idMatched;
  });
}
