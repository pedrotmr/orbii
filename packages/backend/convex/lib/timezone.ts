const MAX_TIMEZONE_LENGTH = 64;

export const normalizeTimezone = (value: string) => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error("Timezone is required");
  }

  if (trimmed.length > MAX_TIMEZONE_LENGTH) {
    throw new Error("Timezone is too long");
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
  } catch {
    throw new Error("Invalid timezone");
  }

  return trimmed;
};
