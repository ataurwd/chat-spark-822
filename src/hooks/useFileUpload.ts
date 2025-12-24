import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFileUpload = (userId: string | undefined) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    if (!userId) {
      toast.error('You must be logged in to upload files');
      return null;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'image' : 'file';

      return { url: publicUrl, type: fileType, name: file.name };
    } catch (error: any) {
      toast.error('Failed to upload file: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
