const DEFAULT_DEBUG_STREAM_CHARS = 4000;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type ChatKitProtocolRequest = {
  type?: string;
  params?: {
    thread_id?: string;
    threadId?: string;
    input?: unknown;
    message?: unknown;
    item?: unknown;
    items?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type NullableThreadId = string | null;

type SearchEndpointFetchConfig = {
  searchApiUrl: string;
  searchApiKey: string;
  searchApiVersionDate: string;
  searchExperienceKey: string;
  searchVersion: string;
  debug?: boolean;
  debugStreamChars?: number;
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, "log" | "error">;
};

type RequestBranch = "proxy-search-stream" | "synthetic-json" | "message-error-stream";

function collectUserText(value: unknown, textParts: string[] = [], parentKey?: string) {
  if (typeof value === "string") {
    if (parentKey === "input" || parentKey === "message" || parentKey === "text" || parentKey === "content") {
      const trimmed = value.trim();
      if (trimmed) {
        textParts.push(trimmed);
      }
    }

    return textParts;
  }

  if (!value || typeof value !== "object") {
    return textParts;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectUserText(item, textParts, parentKey));
    return textParts;
  }

  const jsonValue = value as Record<string, unknown>;
  const role = typeof jsonValue.role === "string" ? jsonValue.role : null;
  const type = typeof jsonValue.type === "string" ? jsonValue.type : null;
  const text = typeof jsonValue.text === "string" ? jsonValue.text : null;
  const content = jsonValue.content;

  if ((role === "user" || type === "input_text") && text) {
    const trimmed = text.trim();
    if (trimmed) {
      textParts.push(trimmed);
    }
  }

  if (typeof content === "string" && (role === "user" || parentKey === "message" || parentKey === "input")) {
    const trimmed = content.trim();
    if (trimmed) {
      textParts.push(trimmed);
    }
  } else {
    collectUserText(content, textParts, "content");
  }

  Object.entries(jsonValue).forEach(([key, item]) => {
    if (key !== "content") {
      collectUserText(item, textParts, key);
    }
  });

  return textParts;
}

function getRequestType(request: ChatKitProtocolRequest | null) {
  return request?.type?.toLowerCase() ?? "";
}

function getRequestBranch(request: ChatKitProtocolRequest | null, userInput: string): RequestBranch {
  if (userInput) {
    return "proxy-search-stream";
  }

  const requestType = getRequestType(request);

  if (!requestType) {
    return "message-error-stream";
  }

  if (requestType.includes("history")) {
    return "synthetic-json";
  }

  if (
    requestType.includes("thread") &&
    !requestType.includes("message") &&
    !requestType.includes("response") &&
    !requestType.includes("run") &&
    !requestType.includes("input")
  ) {
    return "synthetic-json";
  }

  if (
    requestType.includes("item") &&
    !requestType.includes("message") &&
    !requestType.includes("input")
  ) {
    return "synthetic-json";
  }

  return "message-error-stream";
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function getRequestBodyText(input: RequestInfo | URL, init?: RequestInit) {
  const body = init?.body ?? (input instanceof Request ? input.body : null);

  if (!body) {
    return null;
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof Blob) {
    return await body.text();
  }

  if (body instanceof FormData) {
    return JSON.stringify(Object.fromEntries(body.entries()));
  }

  if (body instanceof ReadableStream) {
    return await new Response(body).text();
  }

  return null;
}

export function extractLatestUserInput(bodyText: string | null) {
  if (!bodyText) {
    return "";
  }

  try {
    const bodyJson = JSON.parse(bodyText) as JsonValue;
    const textParts = collectUserText(bodyJson);
    return textParts[textParts.length - 1] ?? "";
  } catch {
    return bodyText.trim();
  }
}

export function parseChatKitRequest(bodyText: string | null): ChatKitProtocolRequest | null {
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as ChatKitProtocolRequest;
  } catch {
    return null;
  }
}

export function getRequestThreadId(request: ChatKitProtocolRequest | null, fallbackThreadId: NullableThreadId) {
  const requestThreadId = request?.params?.thread_id ?? request?.params?.threadId;

  if (typeof requestThreadId === "string" && requestThreadId.trim()) {
    return requestThreadId;
  }

  return fallbackThreadId;
}

export function createSyntheticChatKitResponse(request: ChatKitProtocolRequest | null, threadId: string) {
  const requestType = request?.type ?? "unknown";
  const now = new Date().toISOString();
  const thread = {
    id: threadId,
    title: "Search chat",
    created_at: now,
    updated_at: now,
  };

  if (requestType.includes("thread")) {
    if (requestType.includes("list")) {
      return jsonResponse({ data: [thread], has_more: false });
    }

    return jsonResponse({ data: thread });
  }

  if (requestType.includes("item") || requestType.includes("history")) {
    return jsonResponse({ data: [], has_more: false });
  }

  return jsonResponse({ data: [], has_more: false });
}

export function withDebugStreamLogging(
  response: Response,
  logger: Pick<Console, "log" | "error"> = console,
  debugStreamChars = DEFAULT_DEBUG_STREAM_CHARS,
) {
  if (!response.body) {
    return response;
  }

  const [debugStream, chatkitStream] = response.body.tee();

  void (async () => {
    const reader = debugStream.getReader();
    const decoder = new TextDecoder();
    let loggedChars = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        if (!value || loggedChars >= debugStreamChars) {
          continue;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        const remainingChars = debugStreamChars - loggedChars;
        const slice = chunk.slice(0, remainingChars);
        if (slice) {
          logger.log("ChatKit search stream chunk", slice);
          loggedChars += slice.length;
        }
      }
    } catch (error) {
      logger.error("Failed to read ChatKit search stream debug body", error);
    } finally {
      reader.releaseLock();
    }
  })();

  return new Response(chatkitStream, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function chatKitErrorStreamResponse(threadId: string, message: string) {
  const createdAt = new Date().toISOString();
  const itemId = `message_error_${Date.now()}`;
  const item = {
    id: itemId,
    thread_id: threadId,
    type: "assistant_message",
    created_at: createdAt,
    content: [{ text: message, annotations: [] }],
  };
  const body = [
    `event: thread.item.added\ndata: ${JSON.stringify({ item })}`,
    `event: thread.item.done\ndata: ${JSON.stringify({ item })}`,
    "",
  ].join("\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
    status: 200,
  });
}

export async function searchEndpointFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  localThreadId: NullableThreadId,
  config: SearchEndpointFetchConfig,
) {
  const bodyText = await getRequestBodyText(input, init);
  const chatKitRequest = parseChatKitRequest(bodyText);
  const userInput = extractLatestUserInput(bodyText);
  const threadId = getRequestThreadId(chatKitRequest, localThreadId);
  const normalizedThreadId = threadId ?? "";
  const logger = config.logger ?? console;
  const debug = config.debug ?? false;
  const branch = getRequestBranch(chatKitRequest, userInput);

  if (debug) {
    logger.log("ChatKit protocol request", {
      branch,
      type: chatKitRequest?.type,
      threadId: normalizedThreadId,
      input: userInput,
      params: chatKitRequest?.params,
    });
  }

  if (branch === "synthetic-json") {
    if (debug) {
      logger.log("ChatKit synthetic response", {
        type: chatKitRequest?.type,
        threadId: normalizedThreadId,
      });
    }

    return createSyntheticChatKitResponse(chatKitRequest, normalizedThreadId);
  }

  if (!userInput) {
    if (debug) {
      logger.error("ChatKit message request missing user input", {
        type: chatKitRequest?.type,
        threadId: normalizedThreadId,
        bodyText,
      });
    }

    return chatKitErrorStreamResponse(normalizedThreadId, "Sorry, I couldn't read that message. Please try again.");
  }

  const searchUrl = new URL(config.searchApiUrl);

  if (config.searchApiKey) {
    searchUrl.searchParams.set("api_key", config.searchApiKey);
  }

  searchUrl.searchParams.set("v", config.searchApiVersionDate);
  searchUrl.searchParams.set("input", userInput);
  searchUrl.searchParams.set("thread_id", normalizedThreadId);
  searchUrl.searchParams.set("experienceKey", config.searchExperienceKey);
  searchUrl.searchParams.set("version", config.searchVersion);

  const headers = new Headers(init?.headers);
  headers.delete("content-type");
  headers.delete("content-length");

  if (debug) {
    logger.log("ChatKit search request", {
      input: userInput,
      url: searchUrl.toString(),
    });
  }

  try {
    const response = await (config.fetchImpl ?? fetch)(searchUrl.toString(), {
      method: "POST",
      headers,
      signal: init?.signal,
      credentials: init?.credentials,
      mode: init?.mode,
      cache: init?.cache,
      redirect: init?.redirect,
      referrer: init?.referrer,
      referrerPolicy: init?.referrerPolicy,
    });

    if (debug) {
      const contentType = response.headers.get("content-type");
      const isEventStream = contentType?.includes("text/event-stream") ?? false;
      const responseBody = isEventStream ? "<event stream>" : await response.clone().text();

      logger.log("ChatKit search response", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType,
        body: responseBody.slice(0, 2000),
      });

      if (!response.ok) {
        return chatKitErrorStreamResponse(normalizedThreadId, "Sorry, the search endpoint returned an error. Please try again.");
      }

      if (isEventStream) {
        return withDebugStreamLogging(response, logger, config.debugStreamChars ?? DEFAULT_DEBUG_STREAM_CHARS);
      }
    }

    if (!response.ok) {
      return chatKitErrorStreamResponse(normalizedThreadId, "Sorry, the search endpoint returned an error. Please try again.");
    }

    return response;
  } catch (error) {
    if (debug) {
      logger.error("ChatKit search request failed", error);
    }

    throw error;
  }
}
