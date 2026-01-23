import { ChatKit, useChatKit } from "@openai/chatkit-react";

const CHATKIT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/chatkit";

// Domain key for ChatKit integration
// - Local development: Uses default "domain_pk_localhost_dev"
// - Production: Register your domain at https://platform.openai.com/settings/organization/security/domain-allowlist
//   and set VITE_CHATKIT_API_DOMAIN_KEY in your .env file
const CHATKIT_API_DOMAIN_KEY =
  import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_localhost_dev";

export default function App() {
  const chatkit = useChatKit({
    api: {
      url: CHATKIT_API_URL,
      domainKey: CHATKIT_API_DOMAIN_KEY,
    },
    startScreen: {
      greeting: "Hello! I'm your ChatKit assistant with reference tracking. Ask me anything!",
      prompts: [
        { label: "How does ChatKit work?", prompt: "Can you explain how the ChatKit SDK works?" },
        { label: "What is this demo?", prompt: "What can I do with this demo application?" },
        { label: "Tell me about references", prompt: "How are references displayed in this interface?" },
      ],
    },
    composer: {
      placeholder: "Type your message...",
    },
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ChatKit control={chatkit.control} style={{ height: "100%" }} />
    </div>
  );
}
