"""
ChatKit Demo Backend using OpenAI ChatKit SDK

This backend implements the ChatKit server protocol, providing a chat interface
using the OpenAI ChatKit SDK.
"""

import os
from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any

import uvicorn
from chatkit.server import ChatKitServer
from chatkit.types import ThreadMetadata, ThreadStreamEvent, UserMessageItem
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from simple_store import SimpleStore

# Load environment variables
load_dotenv()


class DemoChatKitServer(ChatKitServer[dict[str, Any]]):
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
        if input_user_message is None:
            return

        # Extract user message text
        user_text = ""
        if input_user_message.content:
            for content_part in input_user_message.content:
                if hasattr(content_part, "text"):
                    user_text = content_part.text
                    break

        if not user_text:
            return

        # For now, return a simple mock response
        # TODO: Integrate with OpenAI API or Agents SDK
        from chatkit.types import (
            AssistantMessageItem,
            AssistantMessageTextContent,
            ThreadItemDoneEvent,
        )
        
        item_id = self.store.generate_id("message")
        response_text = f"I received your message: '{user_text[:100]}...'. This is using the OpenAI ChatKit SDK!"
        
        assistant_message = AssistantMessageItem(
            id=item_id,
            thread_id=thread.id,
            created_at=datetime.now(),
            role="assistant",
            content=[AssistantMessageTextContent(type="text", text=response_text)],
        )
        
        yield ThreadItemDoneEvent(type="thread.item.done", item=assistant_message)


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
    """ChatKit protocol endpoint."""
    body = await request.body()
    context = {}  # You can add user context here
    
    result = await chatkit_server.process(body, context)
    
    # Check if it's streaming or non-streaming
    if hasattr(result, 'stream'):
        # Streaming response
        async def event_stream():
            async for event in result.stream:
                # ChatKit uses Server-Sent Events format
                yield f"data: {event}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    else:
        # Non-streaming response
        return JSONResponse(content=result.response)


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
