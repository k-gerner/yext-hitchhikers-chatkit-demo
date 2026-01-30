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
from typing import Any, Dict

import uvicorn
from agents import Agent, FileSearchTool, Runner  # Agents SDK  [oai_citation:4‡OpenAI GitHub](https://openai.github.io/openai-agents-python/tools/)
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

VECTOR_STORE_ID = "vs_68c3406b54148191b1bccebbc53ee263" # Hitchhikers
# VECTOR_STORE_ID = "vs_696fe274d4e48191a041e24ea386b0bb" # Samsung
agent = Agent(
    name="RAG assistant",
    instructions=(
        "Only use information from the Knowledge Base. "
        "If no answer is found, say 'I don't know' or similar. "
        "In your response, do not mention the file store directly, just the references themselves. "
        "Make sure to cite sources when you use them. "
        "If the input is blank or just regular conversation, you can just greet/respond to the user in a friendly manner. "
    ),
    tools=[
        FileSearchTool(
            vector_store_ids=[VECTOR_STORE_ID],
            max_num_results=8,
        )
    ],
)


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

        result = Runner.run_streamed(agent, agent_input, context=agent_ctx)

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
    context = {}

    print("threads: ", chatkit_server.store.threads)
    result = await chatkit_server.process(body, context)

    # STREAMING (SSE)
    if  isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")

    # NON-STREAMING
    else:
        return Response(content=result.json, media_type="application/json")


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
