import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useEffect, useRef, useState } from "react";

const CHATKIT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/chatkit";
const CHATKIT_API_DOMAIN_KEY = import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_localhost_dev";

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [radius, setRadius] = useState<"pill" | "round" | "soft" | "sharp">("round");
  const [density, setDensity] = useState<"compact" | "normal" | "spacious">("normal");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const chatkit = useChatKit({
    api: {
      url: CHATKIT_API_URL,
      domainKey: CHATKIT_API_DOMAIN_KEY,
    },
    initialThread: activeThreadId,
    theme: {
      colorScheme, // Alternatives: "light", "dark"
      radius,   // Alternatives: "pill", "round", "soft", "sharp"
      density // Alternatives: "compact", "normal", "spacious"
    },
    onThreadChange: (e) => setActiveThreadId(e.threadId),
    onReady: () => console.log("ChatKit ready"),
    onError: (e) => console.error("ChatKit error:", e.error),
    onLog: (e) => console.log("ChatKit log:", e.name, e.data),
    onEffect: (e) => console.log("ChatKit effect:", e.name, e.data),
    startScreen: {
      greeting: "Hello! I'm your ChatKit assistant. Ask me anything broski!",
      prompts: [
      {
        icon: 'circle-question',
        label: 'What is Yext Search?',
        prompt: 'What is Yext Search?'
      },
      {
        icon: 'circle-question',
        label: 'Help me with a Search Frontend',
        prompt: 'How can I set up a new Search Frontend?'
      },
      {
        icon: 'circle-question',
        label: 'What are custom phrases?',
        prompt: 'What are custom phrases in Yext Search?'
      },
    ],
    },
    composer: {
      placeholder: "Type your message...",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, [chatkit]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen font-sans">
        Loading ChatKit...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen p-5 bg-gray-50 box-border">
      <div className="bg-gray-100 p-4 mb-5 rounded-lg font-mono text-sm border border-gray-300">
        <div className="font-bold mb-2">ChatKit Debug Info:</div>
        <div>API URL: <code className="bg-gray-200 px-1 rounded">{CHATKIT_API_URL}</code></div>
        <div>Domain Key: <code className="bg-gray-200 px-1 rounded">{CHATKIT_API_DOMAIN_KEY}</code></div>
        <div>Status: {chatkit ? '✅ Initialized' : '❌ Not Initialized'}</div>
        {chatkit?.control && <div>Control Methods: {Object.keys(chatkit.control).join(', ')}</div>}
      </div>
      
      <div className="flex-1 flex flex-col border-2 border-blue-500 rounded-lg overflow-hidden min-h-[500px] relative bg-white">
        <div className="mb-3 flex flex-wrap gap-4 font-sans text-md">
          <label className="flex flex-col gap-1">
            <span className="text-gray-700">Color scheme</span>
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1"
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as "light" | "dark")}
            >
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700">Radius</span>
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1"
              value={radius}
              onChange={(e) => setRadius(e.target.value as "pill" | "round" | "soft" | "sharp")}
            >
              <option value="pill">pill</option>
              <option value="round">round</option>
              <option value="soft">soft</option>
              <option value="sharp">sharp</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700">Density</span>
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1"
              value={density}
              onChange={(e) => setDensity(e.target.value as "compact" | "normal" | "spacious")}
            >
              <option value="compact">compact</option>
              <option value="normal">normal</option>
              <option value="spacious">spacious</option>
            </select>
          </label>
        </div>
        {chatkit?.control ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {chatkit.control && (
              <>
                <ChatKit 
                  control={chatkit.control}
                  className="h-[600px] w-[360px] shadow-xl rounded-3xl border-2 overflow-hidden"
                  key={`${colorScheme}-${radius}-${density}`} // Force re-render on theme change
                />
                <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white px-2 py-1 rounded text-xs z-[1000]">
                  ChatKit Container
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 font-sans">
            Initializing ChatKit...
          </div>
        )}
      </div>
    </div>
  );
}
