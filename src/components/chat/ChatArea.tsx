import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Download, Share, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message, Conversation } from "@/types/chat";
import { exportConversationAsJSON, exportConversationAsMarkdown, shareConversation } from "@/utils/chatExport";

interface ChatAreaProps {
  currentConversationId: string | null;
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
}

const botLogo = "/lovable-uploads/782bff71-19ad-4277-bed5-375d4114e0c5.png";

const ChatArea = ({ currentConversationId, conversations, messages, isLoading }: ChatAreaProps) => {
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!messageSearchQuery.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(msg =>
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, messageSearchQuery]);

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const handleExportJSON = () => {
    exportConversationAsJSON(currentConversationId, conversations, messages, () => {
      toast({
        title: "Conversation exported",
        description: "Downloaded as JSON file",
      });
    });
  };

  const handleExportMarkdown = () => {
    exportConversationAsMarkdown(currentConversationId, conversations, messages, () => {
      toast({
        title: "Conversation exported",
        description: "Downloaded as Markdown file",
      });
    });
  };

  const handleShare = async () => {
    await shareConversation(currentConversationId, conversations, messages, () => {
      toast({
        title: "Conversation copied",
        description: "Copied to clipboard",
      });
    });
  };

  return (
    <>
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              {conversations.find(c => c.id === currentConversationId)?.title || "Untitled"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {messageSearchQuery ? `${filteredMessages.length} of ${messages.length}` : messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {messages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJSON}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share/Copy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {messages.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {messageSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setMessageSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {(messageSearchQuery ? filteredMessages : messages).map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="flex-shrink-0">
                {message.role === "assistant" ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img src={botLogo} alt="UltriumGPT" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Card
                className={`max-w-[80%] p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {messageSearchQuery ? highlightSearchTerm(message.content, messageSearchQuery) : message.content}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={botLogo} alt="UltriumGPT" className="w-full h-full object-cover" />
              </div>
              <Card className="bg-muted p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};

export default ChatArea;