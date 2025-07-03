export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  file_attachments?: ConversationFile[];
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationFile {
  id: string;
  conversation_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  user_id: string;
}