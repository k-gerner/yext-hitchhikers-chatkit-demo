"""
ChatKit Demo Backend using OpenAI ChatKit SDK

This backend implements the ChatKit server protocol, providing a chat interface
using the OpenAI ChatKit SDK.
"""

import os
import json
from collections.abc import AsyncIterator
from datetime import datetime
import random
import sys
import uuid
import httpx
import logging
from typing import Any, Dict

import uvicorn
from openai.types.shared import Reasoning
from agents import Agent, FileSearchTool, Runner, ModelSettings  # Agents SDK  [oai_citation:4‡OpenAI GitHub](https://openai.github.io/openai-agents-python/tools/)
from chatkit.agents import AgentContext, simple_to_agent_input, stream_agent_response
from chatkit.server import ChatKitServer, StreamingResult
from chatkit.types import (
  ThreadMetadata, 
  ThreadStreamEvent, 
  UserMessageItem, 
  ThreadMetadata, 
  UserMessageItem, 
  AssistantMessageItem, 
  AssistantMessageContent, 
  ThreadItemDoneEvent,
  ThreadStreamEvent
)
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from simple_store import SimpleStore

# Load environment variables
load_dotenv()

# VECTOR_STORE_ID = "vs_68c3406b54148191b1bccebbc53ee263" # Hitchhikers
VECTOR_STORE_ID = "vs_696fe274d4e48191a041e24ea386b0bb" # Samsung
DEFAULT_MODEL = "gpt-5-mini"
DEFAULT_VERBOSITY = "low"
ALLOWED_MODELS = {"gpt-5-mini", "gpt-5", "gpt-5-nano", "gpt-4.1"}
ALLOWED_VERBOSITY = {"low", "medium", "high"}


def build_agent(model: str, verbosity: str) -> Agent:
    if model.startswith("gpt-4"):
        return Agent(
            name="RAG assistant",
            instructions=(
                "Only use information from the Knowledge Base. "
                "If no answer is found, say 'I don't know' or similar. "
                "In your response, do not mention the file store directly, just the references themselves. "
                "Make sure to cite sources when you use them. "
                "If the input is blank or just regular conversation, you can just greet/respond to the user in a friendly manner. "
                "Use list formatting where appropriate."
            ),
            tools=[
                FileSearchTool(
                    vector_store_ids=[VECTOR_STORE_ID],
                    max_num_results=8,
                )
            ],
            model=model
        )
    else:
        return Agent(
            name="RAG assistant",
            instructions=(
                "Only use information from the Knowledge Base. "
                "If no answer is found, say 'I don't know' or similar. "
                "In your response, do not mention the file store directly, just the references themselves. "
                "Make sure to cite sources when you use them. "
                "If the input is blank or just regular conversation, you can just greet/respond to the user in a friendly manner. "
                "Use list formatting where appropriate."
            ),
            tools=[
                FileSearchTool(
                    vector_store_ids=[VECTOR_STORE_ID],
                    max_num_results=8,
                )
            ],
            model=model,
            model_settings=ModelSettings(
                reasoning=Reasoning(effort="low"),
                verbosity=verbosity
            )
        )

LOG_FORMAT = "%(asctime)s %(message)s"
logging.basicConfig(
    format=LOG_FORMAT,
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
    force=True,
)
LOGGER = logging.getLogger(__name__)


class DemoChatKitServer(ChatKitServer[Dict[str, Any]]):
    """ChatKit server implementation."""

    def __init__(self, data_store: SimpleStore):
        # Initialize with no attachment store for simplicity
        super().__init__(data_store, attachment_store=None)


    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict[str, Any],
    ) -> AsyncIterator[ThreadStreamEvent]:
        """Handle incoming user messages and generate responses."""
        # Run the agent *streamed* with full thread history
        agent_ctx = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        items_page = await self.store.load_thread_items(
            thread.id,
            after=None,
            limit=1000,
            order="asc",
            context=context,
        )
        agent_input = await simple_to_agent_input(items_page.data)

        model = context.get("model", DEFAULT_MODEL)
        verbosity = context.get("verbosity", DEFAULT_VERBOSITY)
        request_agent = build_agent(model, verbosity)
        result = Runner.run_streamed(request_agent, agent_input, context=agent_ctx)
        print(f"Running agent with model={model} and verbosity={verbosity}")

        # IMPORTANT: this converts Responses/Agents streaming events -> ChatKit ThreadStreamEvents
        # and auto-attaches file/url citations as ChatKit annotations (Sources in UI).
        async for ev in stream_agent_response(agent_ctx, result):
            yield ev




# Create FastAPI app
app = FastAPI(title="ChatKit Demo Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create store and server
data_store = SimpleStore()
chatkit_server = DemoChatKitServer(data_store)


@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    body = await request.body()
    raw_model = request.headers.get("x-chatkit-model")
    raw_verbosity = request.headers.get("x-chatkit-verbosity")

    model = raw_model or DEFAULT_MODEL
    verbosity = raw_verbosity or DEFAULT_VERBOSITY

    if raw_model is not None and raw_model.strip() == "":
        return JSONResponse(
            status_code=400,
            content={
                "message": "X-ChatKit-Model header cannot be empty.",
                "allowed_models": sorted(ALLOWED_MODELS),
            },
        )

    if raw_model is not None and model not in ALLOWED_MODELS:
        return JSONResponse(
            status_code=400,
            content={
                "message": "Invalid X-ChatKit-Model header.",
                "allowed_models": sorted(ALLOWED_MODELS),
            },
        )

    if raw_verbosity is not None and raw_verbosity.strip() == "":
        return JSONResponse(
            status_code=400,
            content={
                "message": "X-ChatKit-Verbosity header cannot be empty.",
                "allowed_verbosity": sorted(ALLOWED_VERBOSITY),
            },
        )

    if raw_verbosity is not None and verbosity not in ALLOWED_VERBOSITY:
        return JSONResponse(
            status_code=400,
            content={
                "message": "Invalid X-ChatKit-Verbosity header.",
                "allowed_verbosity": sorted(ALLOWED_VERBOSITY),
            },
        )

    context = {"model": model, "verbosity": verbosity}

    print("threads: ", chatkit_server.store.threads)
    result = await chatkit_server.process(body, context)

    # STREAMING (SSE)
    if  isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")

    # NON-STREAMING
    else:
        return Response(content=result.json, media_type="application/json")


# @app.post("/chatkit/session")
# async def chatkit_session():
#     session = chatkit_server.create_session(
#         # 👇 THIS is the critical part
#         api_url="https://your-python-api.example.com/chatkit"
#     )

#     return {
#         "client_secret": session.client_secret
#     }


# @app.post("/api/chatkit_session")
# async def create_chatkit_session(request: Request):
#     # Optional: get the frontend's allowed origin
#     origin = request.headers.get("origin")
#     cors_headers = {"Access-Control-Allow-Origin": origin or "*"}

#     try:
#         payload = await request.json()
#     except Exception:
#         return JSONResponse(
#             status_code=400,
#             content={"message": "Invalid JSON body"},
#             headers=cors_headers,
#         )
#     workflow_id = payload.get("workflowId") or payload.get("workflow_id")
#     if not workflow_id:
#         return JSONResponse(
#             status_code=400,
#             content={"message": "Missing workflowId"},
#             headers=cors_headers,
#         )

#     # Optionally, associate the session with a user ID
#     user_id = str(uuid.uuid4())
#     openai_api_key = os.getenv("OPENAI_API_KEY")
#     if not openai_api_key:
#         return JSONResponse(
#             status_code=500,
#             content={"message": "Missing OPENAI_API_KEY"},
#             headers=cors_headers,
#         )

#     url = "https://api.openai.com/v1/chatkit/sessions"
#     session_payload = {
#         "workflow": {"id": workflow_id},
#         "user": user_id,
#         "chatkit_configuration": { "file_upload": { "enabled": True } }
#     }

#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             upstream_response = await client.post(
#                 url,
#                 headers={
#                     "Content-Type": "application/json",
#                     "Authorization": f"Bearer {openai_api_key}",
#                     "OpenAI-Beta": "chatkit_beta=v1",
#                 },
#                 json=session_payload,
#             )
#     except httpx.HTTPError as exc:
#         LOGGER.exception("Failed to create ChatKit session")
#         return JSONResponse(
#             status_code=502,
#             content={"message": "Failed to reach ChatKit API", "details": str(exc)},
#             headers=cors_headers,
#         )

#     upstream_json = upstream_response.json()
#     if upstream_response.is_error:
#         return JSONResponse(
#             status_code=upstream_response.status_code,
#             content={"message": "Failed to create session", "details": upstream_json},
#             headers=cors_headers,
#         )

#     client_secret = upstream_json.get("client_secret")
#     return JSONResponse(
#         status_code=200,
#         content={"clientSecret": client_secret},
#         headers=cors_headers,
#     )


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    print("=" * 60)
    print("🚀 ChatKit Server Starting")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📡 ChatKit endpoint: http://localhost:{port}/chatkit")
    print(f"🔑 API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=port)
