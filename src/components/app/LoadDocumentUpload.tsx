import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoadForm } from "./LoadForm";

interface LoadDocumentUploadProps {
  onSuccess?: () => void;
}

export function LoadDocumentUpload({ onSuccess }: LoadDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      setUploading(false);
      setParsing(true);

      const { data, error } = await supabase.functions.invoke("parse-load-document", {
        body: { fileUrl: publicUrl, fileName: file.name },
      });

      if (error) throw error;

      setExtractedData(data.loadData);
      setParsing(false);

      toast({
        title: "Success",
        description: "Document parsed successfully. Please review the extracted data.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      setParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: uploading || parsing || !!extractedData,
  });

  if (extractedData) {
    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Document parsed successfully
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Review and edit the extracted information below
            </p>
          </div>
        </div>
        <LoadForm initialData={extractedData} onSuccess={onSuccess} />
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${(uploading || parsing) && "opacity-50 cursor-not-allowed"}`}
      >
        <input {...getInputProps()} />
        
        {uploading || parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-medium">
              {uploading ? "Uploading document..." : "Parsing with AI..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {parsing && "This may take a few seconds"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-primary" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium mb-1">
                {isDragActive ? "Drop your file here" : "Upload load document"}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports PDF, Excel, CSV, and text files
            </p>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium flex-1">{file.name}</span>
        </div>
      )}
    </div>
  );
}
