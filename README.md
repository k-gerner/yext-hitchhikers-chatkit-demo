# ChatKit Testing

Demo application using the OpenAI ChatKit SDK with a Python backend and TypeScript/React frontend.

## Features

- 💬 Real-time chat interface with OpenAI GPT-4
- 📚 References panel showing sources used to generate responses
- 🎨 Modern UI built with React and Tailwind CSS
- 🐍 Python Flask backend with OpenAI SDK
- 🔄 Easy to adapt to existing FileSearchTool vector store implementations

## Project Structure

```
chat-kit-testing/
├── backend/           # Python Flask server
│   ├── app.py        # Main Flask application
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # React TypeScript application
    ├── src/
    │   ├── App.tsx              # Main app component
    │   ├── ChatWindow.tsx       # Chat interface
    │   ├── ReferencesPanel.tsx  # References display
    │   ├── api.ts              # API client
    │   └── types.ts            # TypeScript types
    ├── package.json
    └── .env.example
```

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- OpenAI API key

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

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=8000
   ```

6. **Run the backend server:**
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:8000`

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
   
   The default API URL is `http://localhost:8000`. Modify if needed:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   The application will open at `http://localhost:3000`

## Usage

1. Make sure both the backend and frontend servers are running
2. Open your browser to `http://localhost:3000`
3. Start typing messages in the chat window
4. View references in the panel on the right side

## API Endpoints

### Backend API

- `GET /health` - Health check endpoint
- `POST /chat` - Send chat messages and receive responses

Example request to `/chat`:
```json
{
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}
```

Example response:
```json
{
  "message": "I'm doing well, thank you! How can I help you today?",
  "references": [
    {
      "id": "ref_1",
      "title": "Product Documentation",
      "snippet": "Overview of features...",
      "source": "docs/overview.md"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

## Connecting to Your Existing Server

The current backend uses sample references. To connect to your existing server with FileSearchTool:

1. Modify `backend/app.py` to proxy requests to your server on port 9930
2. Update the `/chat` endpoint to:
   - Forward requests to your agent server
   - Extract references from the FileSearchTool results
   - Return the formatted response

Example integration:
```python
import requests

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    
    # Forward to your existing server
    response = requests.post(
        'http://localhost:9930/agent/chat',
        json=data
    )
    
    result = response.json()
    
    # Extract references from FileSearchTool
    references = extract_references(result)
    
    return jsonify({
        "message": result['message'],
        "references": references
    })
```

## Development

### Frontend Development

- Build for production: `npm run build`
- Preview production build: `npm run preview`

### Backend Development

The backend runs in debug mode by default. For production:

```python
app.run(host='0.0.0.0', port=port, debug=False)
```

## Technologies Used

### Backend
- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- OpenAI Python SDK - ChatKit integration
- python-dotenv - Environment variable management

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool and dev server
- Tailwind CSS - Utility-first CSS framework

## Troubleshooting

### Backend Issues

- **ImportError: No module named 'flask'**
  - Make sure you activated the virtual environment
  - Run `pip install -r requirements.txt`

- **OpenAI API Error**
  - Check that your API key is correctly set in `.env`
  - Verify you have API credits available

### Frontend Issues

- **Module not found errors**
  - Delete `node_modules` and run `npm install` again
  
- **API connection errors**
  - Verify the backend is running on port 8000
  - Check CORS settings if accessing from different origin

## License

MIT

## Future Enhancements

- [ ] User authentication
- [ ] Conversation history persistence
- [ ] File upload support for document search
- [ ] Real-time streaming responses
- [ ] Multiple conversation threads
- [ ] Export chat history
