const isRecord = (value: unknown) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export interface ResolvedClerkOAuthApplication {
  id: string;
  name: string | null;
}

export const resolveClerkOAuthApplication = async (
  clientId: string,
  secretKey: string,
) => {
  const limit = 500;
  let offset = 0;

  while (true) {
    const url = new URL("https://api.clerk.com/v1/oauth_applications");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (!response.ok) {
      throw new Error("Clerk OAuth application lookup failed");
    }

    const page: unknown = await response.json();
    const pageRecord = asRecord(page);

    if (!pageRecord || !Array.isArray(pageRecord.data)) {
      throw new Error("Clerk returned an invalid OAuth application list");
    }

    const pageData = pageRecord.data;
    const match = pageData.find((application) => {
      const applicationRecord = asRecord(application);
      return (
        applicationRecord?.client_id === clientId ||
        applicationRecord?.clientId === clientId
      );
    });
    const matchedApplication = asRecord(match);

    if (
      matchedApplication &&
      typeof matchedApplication.id === "string" &&
      matchedApplication.id.length > 0
    ) {
      const name =
        typeof matchedApplication.name === "string" &&
        matchedApplication.name.length > 0
          ? matchedApplication.name
          : typeof matchedApplication.client_name === "string" &&
              matchedApplication.client_name.length > 0
            ? matchedApplication.client_name
            : null;

      return { id: matchedApplication.id, name };
    }

    const nextOffset = offset + pageData.length;
    const totalCount = pageRecord.total_count ?? pageRecord.totalCount;

    if (
      pageData.length < limit ||
      (typeof totalCount === "number" && nextOffset >= totalCount)
    ) {
      return null;
    }

    offset = nextOffset;
  }
};
