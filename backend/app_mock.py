import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import time
import random

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Sample reference data (this will be replaced with actual FileSearchTool data later)
SAMPLE_REFERENCES = [
    {
        "id": "ref_1",
        "title": "Product Documentation - Overview",
        "snippet": "Our platform provides comprehensive solutions for developers...",
        "source": "docs/overview.md"
    },
    {
        "id": "ref_2",
        "title": "API Reference Guide",
        "snippet": "The API endpoints allow you to integrate with our services...",
        "source": "docs/api-reference.md"
    },
    {
        "id": "ref_3",
        "title": "Best Practices",
        "snippet": "Follow these guidelines to ensure optimal performance...",
        "source": "docs/best-practices.md"
    }
]

# Mock responses for testing without API key
MOCK_RESPONSES = [
    "Hello! I'm here to help. I can answer questions about our platform and services.",
    "That's a great question! Based on the documentation, I can provide you with detailed information.",
    "I understand what you're asking. Let me explain this concept clearly.",
    "According to our best practices guide, here's what you should know...",
    "I'd be happy to help with that! Here's what I found in our documentation."
]

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that processes messages and returns AI responses with references.
    
    This is a MOCK version for testing without an OpenAI API key.
    Replace with the actual OpenAI implementation in app.py when ready.
    
    Expected request body:
    {
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ]
    }
    """
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        # Get the last user message
        last_message = messages[-1]['content'] if messages else ""
        
        # Simulate API delay
        time.sleep(0.5)
        
        # Generate a mock response
        assistant_message = random.choice(MOCK_RESPONSES)
        if last_message:
            assistant_message = f"You asked: '{last_message[:50]}{'...' if len(last_message) > 50 else ''}' - {assistant_message}"
        
        # Return sample references
        references = random.sample(SAMPLE_REFERENCES, min(2, len(SAMPLE_REFERENCES)))
        
        return jsonify({
            "message": assistant_message,
            "references": references,
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    print("=" * 60)
    print("🚀 MOCK ChatKit Server Starting")
    print("=" * 60)
    print(f"📍 Server running on: http://localhost:{port}")
    print("⚠️  This is a MOCK server for testing")
    print("📝 Replace with app.py for real OpenAI integration")
    print(f"🐛 Debug mode: {debug_mode}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
