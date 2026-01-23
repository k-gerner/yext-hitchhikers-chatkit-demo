import React from 'react';
import { Message } from './types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-emerald-600 text-white px-5 py-4 border-b border-emerald-700">
        <h2 className="text-lg font-semibold">ChatKit Demo</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <p>Start a conversation! Ask me anything.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex flex-col gap-2 max-w-[80%] animate-slideIn ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div className={`text-xs font-semibold text-gray-600 ${message.role === 'user' ? 'text-right' : ''}`}>
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                message.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex flex-col gap-2 max-w-[80%] self-start animate-slideIn">
            <div className="text-xs font-semibold text-gray-600">Assistant</div>
            <div className="px-4 py-3 rounded-xl bg-gray-100 text-gray-800 flex gap-1">
              <span className="animate-blink">.</span>
              <span className="animate-blink-delay-1">.</span>
              <span className="animate-blink-delay-2">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="flex gap-3 px-5 py-4 border-t border-gray-200 bg-white" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
