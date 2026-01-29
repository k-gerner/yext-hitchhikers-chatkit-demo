# ChatKit Testing

Demo application using the **OpenAI ChatKit SDK** with a Python backend and TypeScript/React frontend.

## Features

- 💬 **OpenAI ChatKit SDK** - Uses the official ChatKit server and client libraries
- 🚀 Real-time chat interface with streaming responses
- 🎨 Modern UI using ChatKit's official React components
- 🐍 Python FastAPI backend implementing ChatKit server protocol
- 📦 Simple in-memory store (easily replaceable with database)
- 🔄 Ready to integrate with FileSearchTool vector store

## What is ChatKit?

[ChatKit](https://platform.openai.com/docs/guides/chatkit) is OpenAI's SDK for building chat applications. It provides:

- **Server SDK** (`openai-chatkit` for Python) - Protocol for handling chat requests
- **Client SDK** (`@openai/chatkit-react` for React) - Pre-built UI components
- **Streaming support** - Real-time message delivery
- **Thread management** - Conversation history handling
- **Widget system** - Interactive UI elements (custom components)

## Project Structure

```
chat-kit-testing/
├── backend/                      # Python FastAPI server
│   ├── app_chatkit.py           # ChatKit server implementation
│   ├── simple_store.py          # In-memory store implementation
│   ├── app.py                   # OLD: Raw OpenAI API (deprecated)
│   ├── app_mock.py              # OLD: Mock server (deprecated)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example
└── frontend/                    # React TypeScript application
    ├── src/
    │   ├── App.tsx              # ChatKit React integration
    │   ├── main.tsx             # React entry point
    │   └── index.css            # Basic styles
    ├── package.json
    └── .env.example
```

## Prerequisites

- Python 3.10 or higher
- Node.js 18.18 or higher
- npm 9 or higher
- OpenAI API key (optional - works in demo mode without one)

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` to add your OpenAI API key (optional - demo works without it):
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=8000
   ```

6. **Run the ChatKit backend server:**
   ```bash
   python app_chatkit.py
   ```
   
   The server will start on `http://localhost:8000`
   - ChatKit endpoint: `http://localhost:8000/chatkit`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env
   ```
   
   The defaults work for local development:
   ```
   VITE_API_URL=http://localhost:8000/chatkit
   VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_localhost_dev
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   The application will open at `http://localhost:3000`

## Usage

1. Make sure both backend and frontend servers are running
2. Open your browser to `http://localhost:3000`
3. Start chatting! The interface uses OpenAI's ChatKit UI components
4. Try the suggested prompts or type your own messages

## ChatKit Protocol

This implementation follows the [ChatKit protocol specification](https://platform.openai.com/docs/guides/chatkit):

### Backend (Python)

The backend implements the `ChatKitServer` base class:

```python
from chatkit.server import ChatKitServer
from chatkit.types import ThreadMetadata, ThreadStreamEvent, UserMessageItem

class DemoChatKitServer(ChatKitServer):
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict[str, Any],
    ) -> AsyncIterator[ThreadStreamEvent]:
        # Handle user messages and stream responses
        ...
```

### Frontend (React)

The frontend uses the `@openai/chatkit-react` library:

```typescript
import { ChatKit, useChatKit } from "@openai/chatkit-react";

const chatkit = useChatKit({
  api: {
    url: "http://localhost:8000/chatkit",
    domainKey: "domain_pk_localhost_dev",
  },
  // ... configuration
});

return <ChatKit control={chatkit.control} />;
```

## Connecting to Your Existing Server

To integrate with your existing FileSearchTool server on port 9930:

1. Update `backend/app_chatkit.py` in the `respond` method
2. Replace the mock response with a call to your agent server:

```python
async def respond(self, thread, input_user_message, context):
    # Forward to your existing agent server
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:9930/agent/chat",
            json={"messages": messages}
        )
        result = response.json()
        
        # Extract references from FileSearchTool
        references = extract_references_from_agent(result)
        
        # Stream back to ChatKit
        # ... yield ThreadStreamEvents
```

## Development

### Backend Development

The backend uses:
- **FastAPI** - Modern Python web framework
- **openai-chatkit** - ChatKit server SDK
- **uvicorn** - ASGI server

To add features:
- Implement custom `respond()` logic in `DemoChatKitServer`
- Replace `SimpleStore` with a database-backed store
- Add custom widgets using ChatKit's widget system

### Frontend Development

The frontend uses:
- **React 19** - UI framework
- **TypeScript** - Type safety
- **@openai/chatkit-react** - ChatKit UI components
- **Vite** - Build tool

Build for production:
```bash
npm run build
npm run preview
```

## Production Deployment

### Domain Key Registration

For production deployment:

1. Register your domain at [platform.openai.com](https://platform.openai.com/settings/organization/security/domain-allowlist)
2. Get your domain key
3. Set `VITE_CHATKIT_API_DOMAIN_KEY` environment variable

### Backend Deployment

The backend can be deployed to any platform supporting Python:
- AWS Lambda / ECS
- Google Cloud Run
- Azure App Service  
- Heroku
- Fly.io

### Frontend Deployment

The frontend can be deployed to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## Technologies Used

### Backend
- **openai-chatkit** - ChatKit server SDK
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **python-dotenv** - Environment variables

### Frontend
- **@openai/chatkit-react** - ChatKit UI components
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool

## Limitations

- **ChatKit frontend requires internet access** - The `@openai/chatkit-react` library loads from OpenAI's CDN
- **Not suitable for air-gapped environments** - Requires access to `*.openai.com` domains
- **Domain registration required for production** - Local development uses a default key

For more details see:
- [ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [chatkit-js GitHub Issues](https://github.com/openai/chatkit-js/issues)

## Troubleshooting

### Backend Issues

- **Import errors**: Make sure virtual environment is activated and dependencies installed
- **Port already in use**: Change the `PORT` in `.env`
- **No API key**: The app works in demo mode without an OpenAI API key

### Frontend Issues

- **Module not found**: Delete `node_modules` and run `npm install`
- **API connection errors**: Verify backend is running on port 8000
- **ChatKit not loading**: Check internet connectivity (CDN access required)

## Migration from Old Implementation

The old implementation (using custom React components) is deprecated. The new implementation uses the official ChatKit SDK:

**Old files (deprecated):**
- `backend/app.py` - Raw Flask + OpenAI API
- `backend/app_mock.py` - Mock implementation
- `frontend/src/ChatWindow.tsx` - Custom component
- `frontend/src/ReferencesPanel.tsx` - Custom component

**New files (current):**
- `backend/app_chatkit.py` - ChatKit SDK implementation
- `frontend/src/App.tsx` - ChatKit React integration

## License

MIT

## Future Enhancements

- [ ] Integrate with FileSearchTool agent on port 9930
- [ ] Add authentication and user management
- [ ] Implement persistent database store (SQLite/PostgreSQL)
- [ ] Add custom widgets for references display
- [ ] Support file attachments
- [ ] Add conversation export feature
