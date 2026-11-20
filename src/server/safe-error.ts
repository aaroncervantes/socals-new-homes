export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "request failed";
  return message
    .replace(/re_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .slice(0, 240);
}
