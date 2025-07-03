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

      // Only process text-based files
      if (file.mime_type.startsWith('text/') || 
          file.mime_type === 'application/json' ||
          file.mime_type === 'application/xml') {
        return await data.text();
      }

      return `[${file.file_name}] - File content available for AI analysis`;
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