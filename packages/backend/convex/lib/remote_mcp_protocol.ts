import { MCP_READ_SCOPE, MCP_WRITE_SCOPE } from "./remote_mcp_auth";

export const MCP_PROTOCOL_VERSION = "2025-11-25";
export const MCP_DEFAULT_PROTOCOL_VERSION = "2025-03-26";
const SUPPORTED_PROTOCOL_VERSIONS = [
  MCP_DEFAULT_PROTOCOL_VERSION,
  "2025-06-18",
  MCP_PROTOCOL_VERSION,
];

export const supportsMcpProtocolVersion = (version: string | null) => {
  return version === null || SUPPORTED_PROTOCOL_VERSIONS.includes(version);
};

export const negotiateMcpProtocolVersion = (requestedVersion: unknown) => {
  return typeof requestedVersion === "string" &&
    SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
    ? requestedVersion
    : MCP_PROTOCOL_VERSION;
};

export interface RemoteMcpTool {
  name: string;
  title: string;
  description: string;
  requiredScope: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: false;
  };
}

export const fingerprintMcpRequestId = async (
  sessionId: string,
  requestId: string | number,
  ...identityParts: string[]
) => {
  const value = JSON.stringify([
    sessionId,
    typeof requestId,
    requestId,
    ...identityParts,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

const isRecord = (value: unknown) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const hasId = (request: JsonRpcRequest) => {
  return Object.hasOwn(request, "id");
};

const rpcError = (id: unknown, code: number, message: string) => {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
};

const toolError = (message: string) => {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
};

const rpcResult = (id: unknown, result: unknown) => {
  return { jsonrpc: "2.0", id, result };
};

export const toolsForScopes = (tools: RemoteMcpTool[], scopes: string[]) => {
  return tools.filter((tool) => scopes.includes(tool.requiredScope));
};

interface DispatchOptions {
  scopes: string[];
  tools: RemoteMcpTool[];
  protocolVersion?: string;
  sessionId?: string;
  execute: (
    toolName: string,
    args: Record<string, unknown>,
    requestId: string | number,
    sessionId?: string,
  ) => Promise<unknown>;
}

interface DispatchResponse {
  status: number;
  body?: unknown;
  requiredScope?: string;
  protocolVersion?: string;
  sessionId?: string;
}

const dispatchRemoteMcpSingle: (
  input: unknown,
  options: DispatchOptions,
) => Promise<DispatchResponse> = async (input, options) => {
  const inputRecord = asRecord(input);

  if (!inputRecord) {
    return { status: 200, body: rpcError(null, -32600, "Invalid request") };
  }

  if (
    inputRecord.jsonrpc === "2.0" &&
    Object.hasOwn(inputRecord, "id") &&
    !Object.hasOwn(inputRecord, "method") &&
    (Object.hasOwn(inputRecord, "result") ||
      Object.hasOwn(inputRecord, "error"))
  ) {
    return { status: 202 };
  }

  const request = inputRecord as JsonRpcRequest;
  const responseId = request.id ?? null;
  const hasRequestId = hasId(request);

  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return {
      status: 200,
      body: rpcError(responseId, -32600, "Invalid request"),
    };
  }

  if (!hasRequestId) {
    return { status: 202 };
  }

  if (
    (typeof request.id !== "string" && typeof request.id !== "number") ||
    (typeof request.id === "number" && !Number.isFinite(request.id))
  ) {
    return {
      status: 200,
      body: rpcError(null, -32600, "Invalid request"),
    };
  }

  const requestId = request.id;

  if (request.method === "initialize") {
    const params = asRecord(request.params) ?? {};
    const protocolVersion = negotiateMcpProtocolVersion(params.protocolVersion);

    return {
      status: 200,
      protocolVersion,
      sessionId: crypto.randomUUID(),
      body: rpcResult(requestId, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "orbii", version: "0.1.0" },
      }),
    };
  }

  if (request.method === "ping") {
    return { status: 200, body: rpcResult(requestId, {}) };
  }

  if (request.method === "tools/list") {
    return {
      status: 200,
      body: rpcResult(requestId, {
        tools: toolsForScopes(options.tools, options.scopes).map(
          ({ requiredScope: _scope, ...tool }) => tool,
        ),
      }),
    };
  }

  if (request.method === "tools/call") {
    const params = asRecord(request.params) ?? {};
    const toolName = typeof params.name === "string" ? params.name : "";
    const tool = options.tools.find((candidate) => candidate.name === toolName);

    if (!tool) {
      return {
        status: 200,
        body: rpcResult(
          requestId,
          toolError(`Unknown Orbii tool: ${toolName || "(missing name)"}`),
        ),
      };
    }

    if (!options.scopes.includes(tool.requiredScope)) {
      if (tool.requiredScope === MCP_WRITE_SCOPE) {
        return {
          status: 403,
          requiredScope: MCP_WRITE_SCOPE,
          body: rpcError(
            requestId,
            -32003,
            "This connection needs write access",
          ),
        };
      }

      return {
        status: 403,
        requiredScope: MCP_READ_SCOPE,
        body: rpcError(requestId, -32003, "This connection needs read access"),
      };
    }

    const args = asRecord(params.arguments) ?? {};

    try {
      return {
        status: 200,
        body: rpcResult(requestId, {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await options.execute(
                  tool.name,
                  args,
                  requestId,
                  options.sessionId,
                ),
              ),
            },
          ],
          isError: false,
        }),
      };
    } catch (error) {
      return {
        status: 200,
        body: rpcResult(
          requestId,
          toolError(
            error instanceof Error
              ? error.message
              : "Orbii could not complete the action",
          ),
        ),
      };
    }
  }

  return {
    status: 200,
    body: rpcError(requestId, -32601, `Method not found: ${request.method}`),
  };
};

export const dispatchRemoteMcpMessage: (
  input: unknown,
  options: DispatchOptions,
) => Promise<DispatchResponse> = async (input, options) => {
  if (!Array.isArray(input)) {
    return await dispatchRemoteMcpSingle(input, options);
  }

  const protocolVersion =
    options.protocolVersion ?? MCP_DEFAULT_PROTOCOL_VERSION;
  if (protocolVersion !== MCP_DEFAULT_PROTOCOL_VERSION) {
    return {
      status: 400,
      body: rpcError(
        null,
        -32600,
        "JSON-RPC batches require MCP protocol version 2025-03-26",
      ),
    };
  }

  if (input.length === 0) {
    return { status: 200, body: rpcError(null, -32600, "Invalid request") };
  }

  const initializeMessages = input.filter((message) => {
    return asRecord(message)?.method === "initialize";
  });
  if (initializeMessages.length > 0) {
    const initialize = asRecord(initializeMessages[0]);
    const params = asRecord(initialize?.params);
    if (
      input.length !== 1 ||
      params?.protocolVersion !== MCP_DEFAULT_PROTOCOL_VERSION
    ) {
      return {
        status: 400,
        body: rpcError(
          null,
          -32600,
          "Initialize must be sent alone using the batch-capable protocol version",
        ),
      };
    }
  }

  const responses: unknown[] = [];
  const requiredScopes = new Set<string>();
  let sessionId = options.sessionId;

  for (const message of input) {
    const response = await dispatchRemoteMcpSingle(message, {
      ...options,
      sessionId,
    });

    if (response.sessionId) {
      sessionId = response.sessionId;
    }

    if (response.status === 202) {
      continue;
    }

    if (response.requiredScope) {
      requiredScopes.add(response.requiredScope);
      const responseBody = asRecord(response.body);
      const error = asRecord(responseBody?.error);
      responses.push(
        responseBody && error
          ? {
              ...responseBody,
              error: {
                ...error,
                data: { requiredScope: response.requiredScope },
              },
            }
          : response.body,
      );
      continue;
    }

    responses.push(response.body);
  }

  if (responses.length === 0) {
    return { status: 202 };
  }

  return {
    status: requiredScopes.size > 0 ? 403 : 200,
    body: responses,
    ...(requiredScopes.size > 0
      ? { requiredScope: [...requiredScopes].sort().join(" ") }
      : {}),
    ...(sessionId ? { sessionId } : {}),
  };
};
