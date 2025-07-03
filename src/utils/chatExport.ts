import { Message, Conversation } from "@/types/chat";

export const exportConversationAsJSON = (
  conversationId: string | null,
  conversations: Conversation[],
  messages: Message[],
  onSuccess: () => void
) => {
  const conversation = {
    id: conversationId,
    title: conversations.find(c => c.id === conversationId)?.title || "Untitled",
    messages: messages,
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(conversation, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onSuccess();
};

export const exportConversationAsMarkdown = (
  conversationId: string | null,
  conversations: Conversation[],
  messages: Message[],
  onSuccess: () => void
) => {
  const conversation = conversations.find(c => c.id === conversationId);
  const title = conversation?.title || "Untitled";
  
  let markdown = `# ${title}\n\n`;
  markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
  
  messages.forEach((message) => {
    const role = message.role === 'user' ? '**You**' : '**Assistant**';
    markdown += `${role}: ${message.content}\n\n`;
  });
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onSuccess();
};

export const shareConversation = async (
  conversationId: string | null,
  conversations: Conversation[],
  messages: Message[],
  onSuccess: () => void
) => {
  const conversation = conversations.find(c => c.id === conversationId);
  const title = conversation?.title || "Untitled";
  
  let text = `${title}\n\n`;
  messages.forEach(message => {
    const role = message.role === 'user' ? 'You' : 'Assistant';
    text += `${role}: ${message.content}\n\n`;
  });
  
  if (navigator.share && messages.length > 0) {
    try {
      await navigator.share({
        title: `UltriumGPT Conversation: ${title}`,
        text: text
      });
      return;
    } catch (error) {
      // Fallback to clipboard
    }
  }
  
  // Fallback: copy to clipboard
  await navigator.clipboard.writeText(text);
  onSuccess();
};