export function parseEngineValue(engine: string | null | undefined): {
  engine_size: string;
  engine_type: string;
} {
  const trimmed = engine?.trim() ?? "";

  if (!trimmed) {
    return {
      engine_size: "",
      engine_type: "",
    };
  }

  const match = trimmed.match(/^([\d.]+)\s*L?\s*(.*)$/i);

  if (!match) {
    return {
      engine_size: "",
      engine_type: trimmed,
    };
  }

  return {
    engine_size: match[1] ?? "",
    engine_type: (match[2] ?? "").trim(),
  };
}

export function formatEngineValue(
  engineSize: string | null | undefined,
  engineType: string | null | undefined,
): string | null {
  const size = engineSize?.trim() ?? "";
  const type = engineType?.trim() ?? "";

  if (size && type) {
    return `${size}L ${type}`;
  }

  if (size) {
    return `${size}L`;
  }

  if (type) {
    return type;
  }

  return null;
}
