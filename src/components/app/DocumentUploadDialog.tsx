import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X } from "lucide-react";
import { useUploadDocument, DocumentType } from "@/hooks/useDocuments";

interface DocumentUploadDialogProps {
  loadId?: string;
  trigger?: React.ReactNode;
}

export default function DocumentUploadDialog({ loadId, trigger }: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadDocument();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadMutation.mutateAsync({
      file: selectedFile,
      documentType,
      loadId,
    });

    setSelectedFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload POD, BOL, or other supporting documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pod">Proof of Delivery (POD)</SelectItem>
                <SelectItem value="bol">Bill of Lading (BOL)</SelectItem>
                <SelectItem value="insurance">Certificate of Insurance (COI)</SelectItem>
                <SelectItem value="rate_confirmation">Rate Confirmation</SelectItem>
                <SelectItem value="mc_authority">MC Authority</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {selectedFile ? (
              <div className="space-y-2">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-2">Drag & drop a file here, or click to select</p>
                <p className="text-sm text-muted-foreground">
                  Supported: PDF, Images, Word documents
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}