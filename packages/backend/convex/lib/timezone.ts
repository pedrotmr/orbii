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

export const localDateInTimezone = (
  timeZone: string,
  timestamp = Date.now(),
) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const dateParts = new Map(parts.map((part) => [part.type, part.value]));
  const year = dateParts.get("year");
  const month = dateParts.get("month");
  const day = dateParts.get("day");

  if (!year || !month || !day) {
    throw new Error("Could not determine local date");
  }

  return `${year}-${month}-${day}`;
};
