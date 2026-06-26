type MoneyInputOptions = {
  allowDecimals?: boolean;
};

type MoneyFormatOptions = MoneyInputOptions & {
  decimals?: number;
};

export function sanitizeMoneyInput(
  value: unknown,
  options?: MoneyInputOptions,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value).trim();

  if (!raw) {
    return "";
  }

  const stripped = raw.replace(/[₱$,\s]/g, "");

  if (!options?.allowDecimals) {
    return stripped.replace(/\D/g, "");
  }

  const digitsAndDot = stripped.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = digitsAndDot.split(".");

  if (fractionParts.length === 0) {
    return whole;
  }

  return `${whole}.${fractionParts.join("")}`;
}

export function parseMoneyInput(value: unknown): number | null {
  const sanitized = sanitizeMoneyInput(value, { allowDecimals: true });

  if (!sanitized) {
    return null;
  }

  const parsed = Number(sanitized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMoneyInput(
  value: unknown,
  options?: MoneyFormatOptions,
): string {
  const parsed = typeof value === "number" ? value : parseMoneyInput(value);

  if (parsed === null) {
    return "";
  }

  const allowDecimals = options?.allowDecimals ?? false;
  const decimals = options?.decimals ?? (allowDecimals ? 2 : 0);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(parsed);
}

export function preprocessMoneyValue(value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = parseMoneyInput(value);

  return parsed === null ? value : parsed;
}

export function preprocessRequiredMoneyValue(value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const parsed = parseMoneyInput(value);

  return parsed === null ? value : parsed;
}
