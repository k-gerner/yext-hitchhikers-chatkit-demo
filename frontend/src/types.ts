export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Reference {
  id: string;
  title: string;
  snippet: string;
  source: string;
}

export interface ChatResponse {
  message: string;
  references: Reference[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
