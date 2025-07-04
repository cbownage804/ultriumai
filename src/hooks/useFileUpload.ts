import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ConversationFile } from "@/types/chat";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = useCallback(async (
    file: File,
    conversationId: string
  ): Promise<ConversationFile | null> => {
    if (!user) return null;

    try {
      setIsUploading(true);

      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file record to database
      const { data, error: dbError } = await supabase
        .from('conversation_files')
        .insert({
          conversation_id: conversationId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  const deleteFile = useCallback(async (file: ConversationFile): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('chat-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('conversation_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: `${file.file_name} deleted successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const getFileContent = useCallback(async (file: ConversationFile): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('chat-files')
        .download(file.file_path);

      if (error) throw error;

      // Enhanced file type processing
      if (file.mime_type.startsWith('text/') || 
          file.mime_type === 'application/json' ||
          file.mime_type === 'application/xml' ||
          file.mime_type === 'application/javascript' ||
          file.mime_type === 'application/typescript') {
        return await data.text();
      }

      // Handle CSV files
      if (file.mime_type === 'text/csv' || file.file_name.endsWith('.csv')) {
        const csvContent = await data.text();
        const lines = csvContent.split('\n').slice(0, 50); // Limit to first 50 rows
        return `CSV File: ${file.file_name}\nPreview (first 50 rows):\n${lines.join('\n')}`;
      }

      // Handle code files by extension
      const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.php', '.rb', '.go', '.rs', '.sql', '.css', '.html', '.md'];
      const fileExt = '.' + file.file_name.split('.').pop()?.toLowerCase();
      
      if (codeExtensions.includes(fileExt)) {
        const content = await data.text();
        return `Code File: ${file.file_name} (${fileExt})\n\`\`\`${fileExt.slice(1)}\n${content}\n\`\`\``;
      }

      // For other files, provide metadata
      return `File: ${file.file_name} (${(file.file_size / 1024).toFixed(2)} KB)
Type: ${file.mime_type}
Note: This file has been uploaded for AI analysis. The AI can discuss the file's purpose, contents, and provide insights based on its type and context.`;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }, []);

  return {
    uploadFile,
    deleteFile,
    getFileContent,
    isUploading
  };
};