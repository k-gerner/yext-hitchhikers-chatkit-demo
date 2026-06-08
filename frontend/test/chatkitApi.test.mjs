import assert from "node:assert/strict";
import test from "node:test";

const { extractLatestUserInput, searchEndpointFetch } = await import("../.test-dist/chatkitApi.js");

function createConfig(overrides = {}) {
  return {
    searchApiUrl: "http://localhost/v2/accounts/me/search/test",
    searchApiKey: "test-api-key",
    searchApiVersionDate: "20191101",
    searchExperienceKey: "support-search",
    searchVersion: "STAGING",
    ...overrides,
  };
}

test("extractLatestUserInput handles string input payloads", () => {
  const requestBody = JSON.stringify({
    type: "response.create",
    params: {
      input: "How do I reset my password?",
    },
  });

  assert.equal(extractLatestUserInput(requestBody), "How do I reset my password?");
});

test("assistant turns proxy through to the streaming search response", async () => {
  const requestBody = JSON.stringify({
    type: "thread.message.create",
    params: {
      threadId: "thread-123",
      message: {
        role: "user",
        content: [{ type: "input_text", text: "How do I reset my password?" }],
      },
    },
  });

  const eventStreamBody = [
    "event: thread.item.added",
    'data: {"item":{"id":"msg_1"}}',
    "",
  ].join("\n");
  let proxiedUrl = "";
  let proxiedMethod = "";

  const response = await searchEndpointFetch(
    new Request("http://chatkit.local/messages", {
      method: "POST",
      body: requestBody,
      headers: { "content-type": "application/json" },
    }),
    undefined,
    "local-thread-fallback",
    createConfig({
      fetchImpl: async (input, init) => {
        proxiedUrl = String(input);
        proxiedMethod = init?.method ?? "";

        return new Response(eventStreamBody, {
          headers: { "Content-Type": "text/event-stream; charset=utf-8" },
          status: 200,
        });
      },
    }),
  );

  const requestUrl = new URL(proxiedUrl);
  assert.equal(proxiedMethod, "POST");
  assert.equal(requestUrl.searchParams.get("input"), "How do I reset my password?");
  assert.equal(requestUrl.searchParams.get("thread_id"), "thread-123");
  assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/i);
  assert.equal(await response.text(), eventStreamBody);
});

test("assistant turns without a thread id send an empty thread_id to create a new conversation", async () => {
  const requestBody = JSON.stringify({
    type: "thread.message.create",
    params: {
      message: {
        role: "user",
        content: [{ type: "input_text", text: "Start a new chat" }],
      },
    },
  });

  let proxiedUrl = "";

  await searchEndpointFetch(
    new Request("http://chatkit.local/messages", {
      method: "POST",
      body: requestBody,
      headers: { "content-type": "application/json" },
    }),
    undefined,
    null,
    createConfig({
      fetchImpl: async (input) => {
        proxiedUrl = String(input);

        return new Response("event: thread.created\ndata: {\"thread\":{\"id\":\"conv_123\"}}\n\n", {
          headers: { "Content-Type": "text/event-stream; charset=utf-8" },
          status: 200,
        });
      },
    }),
  );

  const requestUrl = new URL(proxiedUrl);
  assert.equal(requestUrl.searchParams.get("input"), "Start a new chat");
  assert.equal(requestUrl.searchParams.get("thread_id"), "");
});

test("thread-management requests stay on the synthetic JSON path", async () => {
  const requestBody = JSON.stringify({
    type: "thread.list",
    params: {
      threadId: "thread-456",
    },
  });

  let fetchCalled = false;

  const response = await searchEndpointFetch(
    new Request("http://chatkit.local/threads", {
      method: "POST",
      body: requestBody,
      headers: { "content-type": "application/json" },
    }),
    undefined,
    "local-thread-fallback",
    createConfig({
      fetchImpl: async () => {
        fetchCalled = true;
        throw new Error("search backend should not be called for thread list");
      },
    }),
  );

  assert.equal(fetchCalled, false);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
  const payload = await response.json();
  assert.equal(payload.has_more, false);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].id, "thread-456");
  assert.equal(payload.data[0].title, "Search chat");
  assert.ok(typeof payload.data[0].created_at === "string");
  assert.ok(typeof payload.data[0].updated_at === "string");
});

test("debug logging preserves event-stream responses", async () => {
  const requestBody = JSON.stringify({
    type: "thread.message.create",
    params: {
      input: [{ role: "user", content: [{ type: "input_text", text: "stream this" }] }],
    },
  });

  const logs = [];
  const errors = [];
  const eventStreamBody = "event: thread.item.added\ndata: {\"item\":{\"id\":\"msg_2\"}}\n\n";

  const response = await searchEndpointFetch(
    new Request("http://chatkit.local/messages", {
      method: "POST",
      body: requestBody,
      headers: { "content-type": "application/json" },
    }),
    undefined,
    "local-thread-fallback",
    createConfig({
      debug: true,
      logger: {
        log: (...args) => logs.push(args),
        error: (...args) => errors.push(args),
      },
      fetchImpl: async () =>
        new Response(eventStreamBody, {
          headers: { "Content-Type": "text/event-stream" },
          status: 200,
        }),
    }),
  );

  assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/i);
  assert.equal(await response.text(), eventStreamBody);
  assert.equal(errors.length, 0);
  assert.ok(logs.some(([message]) => message === "ChatKit search response"));
});
