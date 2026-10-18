export const MCP_READ_SCOPE = "orbii:read";
export const MCP_WRITE_SCOPE = "orbii:write";

export interface OAuthTokenIdentity {
  userId: string;
  clientId: string;
  clientName: string;
  scopes: string[];
}

interface OAuthTokenVerificationResponse {
  aud?: string | string[];
  audience?: string | string[];
  client_id?: string;
  client_name?: string;
  exp?: number;
  expired?: boolean;
  issuer?: string;
  iss?: string;
  name?: string;
  revoked?: boolean;
  scope?: string;
  scopes?: string[];
  sub?: string;
  subject?: string;
  user_id?: string;
  [key: string]: unknown;
}

export class OAuthVerificationUnavailableError extends Error {
  constructor() {
    super("OAuth verification service is temporarily unavailable");
    this.name = "OAuthVerificationUnavailableError";
  }
}

const asRecord = (value: unknown) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as OAuthTokenVerificationResponse;
};

const asNonEmptyString = (value: unknown) => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const toScopes = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.reduce((scopes: string[], scope) => {
      if (typeof scope === "string" && scope.length > 0) {
        scopes.push(scope);
      }

      return scopes;
    }, []);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
};

const unwrapVerificationResponse = (value: unknown) => {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  return (
    asRecord(record.verified_token) ??
    asRecord(record.verifiedToken) ??
    asRecord(record.access_token) ??
    record
  );
};

const audienceIncludesResource = (
  value: string | string[] | undefined,
  resource: string,
) => {
  if (typeof value === "string") {
    return value === resource;
  }

  return Array.isArray(value) && value.includes(resource);
};

export const parseVerifiedOAuthToken = (
  value: unknown,
  expectedIssuer: string,
  expectedResource: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) => {
  const token = unwrapVerificationResponse(value);

  if (!token || token.expired === true || token.revoked === true) {
    throw new Error("OAuth access token is invalid");
  }

  const issuer = asNonEmptyString(token.iss) ?? asNonEmptyString(token.issuer);

  if (issuer && issuer !== expectedIssuer) {
    throw new Error("OAuth access token has an unexpected issuer");
  }

  if (typeof token.exp === "number" && token.exp <= nowSeconds) {
    throw new Error("OAuth access token is expired");
  }

  const audience = token.aud ?? token.audience;

  if (
    audience !== undefined &&
    !audienceIncludesResource(audience, expectedResource)
  ) {
    throw new Error("OAuth access token has an unexpected audience");
  }

  const userId =
    asNonEmptyString(token.user_id) ??
    asNonEmptyString(token.subject) ??
    asNonEmptyString(token.sub);
  const clientId = asNonEmptyString(token.client_id);
  const scopes = toScopes(token.scopes ?? token.scope);
  const clientName =
    asNonEmptyString(token.client_name) ??
    asNonEmptyString(token.name) ??
    clientId;

  if (!userId || !clientId || !clientName) {
    throw new Error("OAuth access token is missing required identity claims");
  }

  if (!scopes.includes(MCP_READ_SCOPE) && !scopes.includes(MCP_WRITE_SCOPE)) {
    throw new Error("OAuth access token has no Orbii MCP scopes");
  }

  return { userId, clientId, clientName, scopes };
};

export const verifyClerkOAuthToken = async (
  accessToken: string,
  options: {
    expectedIssuer: string;
    expectedResource: string;
    secretKey: string;
    fetcher?: typeof fetch;
  },
) => {
  if (!options.secretKey) {
    throw new Error("Clerk OAuth verification is not configured");
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(
      "https://api.clerk.com/oauth_applications/access_tokens/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: accessToken }),
      },
    );
  } catch {
    throw new OAuthVerificationUnavailableError();
  }

  if (response.status >= 500 || response.status === 429) {
    throw new OAuthVerificationUnavailableError();
  }

  if (!response.ok) {
    throw new Error("OAuth access token is invalid");
  }

  let verificationResponse: unknown;

  try {
    verificationResponse = await response.json();
  } catch {
    throw new OAuthVerificationUnavailableError();
  }

  return parseVerifiedOAuthToken(
    verificationResponse,
    options.expectedIssuer,
    options.expectedResource,
  );
};

const encodeBase64 = (bytes: Uint8Array) => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};

const decodeBase64 = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const encryptionKey = async (secret: string) => {
  const rawKey = decodeBase64(secret);

  if (rawKey.length !== 32) {
    throw new Error("MCP credential encryption key must encode 32 bytes");
  }

  return await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

export const fingerprintOAuthToken = async (accessToken: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(accessToken),
  );

  return encodeBase64(new Uint8Array(digest));
};

export const encryptOAuthToken = async (
  accessToken: string,
  secret: string,
) => {
  const key = await encryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(accessToken),
  );

  return `v1.${encodeBase64(iv)}.${encodeBase64(new Uint8Array(encrypted))}`;
};

export const decryptOAuthToken = async (
  encryptedToken: string,
  secret: string,
) => {
  const [version, encodedIv, encodedCiphertext] = encryptedToken.split(".");

  if (version !== "v1" || !encodedIv || !encodedCiphertext) {
    throw new Error("Stored MCP credential has an unsupported format");
  }

  const key = await encryptionKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(encodedIv) },
    key,
    decodeBase64(encodedCiphertext),
  );

  return new TextDecoder().decode(decrypted);
};
