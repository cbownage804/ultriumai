export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count?: number;
}