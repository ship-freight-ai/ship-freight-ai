import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type DocumentType = Database["public"]["Enums"]["document_type"];

export interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  document_type: DocumentType;
  approved: boolean | null;
  rejected_reason: string | null;
  version: number;
  parent_document_id: string | null;
  user_id: string;
  load_id: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export const useDocuments = (loadId?: string) => {
  return useQuery({
    queryKey: ["documents", loadId],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadId) {
        query = query.eq("load_id", loadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });
};

export const useUserDocuments = () => {
  return useQuery({
    queryKey: ["documents", "user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });
};

export const useDocumentVersions = (parentDocumentId: string) => {
  return useQuery({
    queryKey: ["documents", "versions", parentDocumentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("parent_document_id", parentDocumentId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!parentDocumentId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      loadId,
    }: {
      file: File;
      documentType: DocumentType;
      loadId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          user_id: user.id,
          load_id: loadId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });
};

export const useApproveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .update({
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: null,
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document approved");
    },
    onError: (error) => {
      toast.error("Failed to approve document: " + error.message);
    },
  });
};

export const useRejectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      reason,
    }: {
      documentId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from("documents")
        .update({
          approved: false,
          rejected_reason: reason,
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document rejected");
    },
    onError: (error) => {
      toast.error("Failed to reject document: " + error.message);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });
};

export const useStorePDFDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pdfBlob,
      fileName,
      loadId,
      documentType = 'rate_confirmation',
    }: {
      pdfBlob: Blob;
      fileName: string;
      loadId: string;
      documentType?: DocumentType;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload PDF to storage
      const filePath = `${documentType}s/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          file_name: fileName,
          file_url: publicUrl,
          file_type: 'application/pdf',
          file_size: pdfBlob.size,
          document_type: documentType,
          user_id: user.id,
          load_id: loadId,
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      console.error("Failed to store PDF document:", error);
    },
  });
};

export const useGenerateLoadPDF = () => {
  const queryClient = useQueryClient();
  const storePDF = useStorePDFDocument();
  
  return useMutation({
    mutationFn: async ({ 
      loadId,
      generatePDF,
      fileName,
      documentType = 'rate_confirmation',
    }: {
      loadId: string;
      generatePDF: () => Blob;
      fileName: string;
      documentType?: DocumentType;
    }) => {
      // Generate PDF blob
      const pdfBlob = generatePDF();
      
      // Store in Supabase
      return storePDF.mutateAsync({
        pdfBlob,
        fileName,
        loadId,
        documentType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success('PDF generated and saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate PDF: ' + error.message);
    },
  });
};