import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import ReferencesPanel from './ReferencesPanel';
import { Message, Reference } from './types';
import { sendChatMessage } from './api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(newMessages);
      const assistantMessage: Message = { role: 'assistant', content: response.message };
      setMessages([...newMessages, assistantMessage]);
      
      // Update references with the new ones from the response
      if (response.references && response.references.length > 0) {
        setReferences(response.references);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-5 h-full max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-3">
          <ChatWindow 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
          />
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-700 text-sm">
              Error: {error}
            </div>
          )}
        </div>
        <div className="flex flex-col max-h-[300px] md:max-h-full">
          <ReferencesPanel references={references} />
        </div>
      </div>
    </div>
  );
}

export default App;
