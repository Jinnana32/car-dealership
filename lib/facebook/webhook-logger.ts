import "server-only";

type FacebookWebhookLogLevel = "debug" | "error" | "info" | "warn";

type FacebookWebhookLogContext = Record<string, unknown>;

const LOG_PREFIX = "[facebook-webhook]";

function writeFacebookWebhookLog(
  level: FacebookWebhookLogLevel,
  message: string,
  context?: FacebookWebhookLogContext,
): void {
  const payload = context ? { ...context, message } : { message };
  const serialized = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(LOG_PREFIX, serialized);
      break;
    case "warn":
      console.warn(LOG_PREFIX, serialized);
      break;
    case "debug":
      console.debug(LOG_PREFIX, serialized);
      break;
    default:
      console.info(LOG_PREFIX, serialized);
  }
}

export function logFacebookWebhookInfo(
  message: string,
  context?: FacebookWebhookLogContext,
): void {
  writeFacebookWebhookLog("info", message, context);
}

export function logFacebookWebhookWarn(
  message: string,
  context?: FacebookWebhookLogContext,
): void {
  writeFacebookWebhookLog("warn", message, context);
}

export function logFacebookWebhookError(
  message: string,
  context?: FacebookWebhookLogContext,
): void {
  writeFacebookWebhookLog("error", message, context);
}

export function logFacebookWebhookDebug(
  message: string,
  context?: FacebookWebhookLogContext,
): void {
  writeFacebookWebhookLog("debug", message, context);
}

export function summarizeFacebookWebhookBody(body: unknown): FacebookWebhookLogContext {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { bodyType: typeof body };
  }

  const record = body as Record<string, unknown>;
  const entries = Array.isArray(record.entry) ? record.entry : [];
  const entrySummaries = entries.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { index, type: "invalid" };
    }

    const entryRecord = entry as Record<string, unknown>;
    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];
    const changeFields = changes
      .map((change) => {
        if (!change || typeof change !== "object" || Array.isArray(change)) {
          return "invalid";
        }

        return typeof (change as Record<string, unknown>).field === "string"
          ? (change as Record<string, unknown>).field
          : "unknown";
      })
      .filter((field): field is string => typeof field === "string");

    return {
      changeCount: changes.length,
      changeFields,
      hasMessaging: Array.isArray(entryRecord.messaging),
      id: typeof entryRecord.id === "string" ? entryRecord.id : null,
      index,
      messagingCount: Array.isArray(entryRecord.messaging)
        ? entryRecord.messaging.length
        : 0,
    };
  });

  return {
    bodyType: "object",
    entryCount: entries.length,
    entries: entrySummaries,
    object:
      typeof record.object === "string" ? record.object : null,
  };
}
