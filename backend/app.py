import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that processes messages and returns AI responses with references.
    
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
        
        # Call OpenAI API using ChatKit SDK
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        # Extract the assistant's response
        assistant_message = response.choices[0].message.content
        
        # For now, return sample references
        # TODO: Replace with actual FileSearchTool integration
        # When connected to the existing server on port 9930, this will:
        # 1. Query the vector store with FileSearchTool
        # 2. Extract actual references from the search results
        # 3. Return those references with the response
        references = SAMPLE_REFERENCES[:2]  # Return a subset of sample references
        
        return jsonify({
            "message": assistant_message,
            "references": references,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
