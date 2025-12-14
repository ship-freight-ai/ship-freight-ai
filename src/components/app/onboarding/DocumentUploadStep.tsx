/**
 * Document Upload Step
 * 
 * Carriers must upload COI (Certificate of Insurance) and W-9 documents
 * before proceeding to Stripe bank connection.
 */

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    FileText,
    Upload,
    CheckCircle,
    X,
    AlertCircle,
    ArrowRight,
    Shield,
    FileCheck
} from "lucide-react";
import { useOnboardingStore, useDocumentsComplete } from "@/stores/useOnboardingStore";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";

interface DocumentCardProps {
    type: 'coi' | 'w9';
    title: string;
    description: string;
    uploaded?: { fileName: string; uploadedAt: string };
    onUpload: (file: File) => Promise<void>;
    onRemove: () => void;
    isUploading: boolean;
}

const DocumentCard = ({ type, title, description, uploaded, onUpload, onRemove, isUploading }: DocumentCardProps) => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            await onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        maxFiles: 1,
        disabled: isUploading || !!uploaded
    });

    return (
        <Card className={`p-6 transition-all ${uploaded ? 'border-green-500/30 bg-green-500/5' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploaded ? 'bg-green-500/20' : 'bg-primary/10'
                        }`}>
                        {uploaded ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <FileText className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                {uploaded && (
                    <Badge className="bg-green-600">Uploaded</Badge>
                )}
            </div>

            {uploaded ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm truncate max-w-[200px]">{uploaded.fileName}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onRemove}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
                        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="space-y-2">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                    ) : isDragActive ? (
                        <p className="text-primary">Drop the file here...</p>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Drag & drop or <span className="text-primary">browse</span>
                            </p>
                            <p className="text-xs text-muted-foreground">PDF, PNG, or JPG</p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export const DocumentUploadStep = () => {
    const [uploadingType, setUploadingType] = useState<'coi' | 'w9' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { documents, addDocument, removeDocument, completeDocuments } = useOnboardingStore();
    const documentsComplete = useDocumentsComplete();

    const coiDoc = documents.find(d => d.type === 'coi');
    const w9Doc = documents.find(d => d.type === 'w9');

    const handleUpload = async (type: 'coi' | 'w9', file: File) => {
        setUploadingType(type);
        setError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Upload to Supabase storage
            const fileName = `${user.id}/${type}_${Date.now()}_${file.name}`;
            const { data, error: uploadError } = await supabase.storage
                .from('carrier-documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('carrier-documents')
                .getPublicUrl(fileName);

            addDocument({
                type,
                fileName: file.name,
                fileUrl: publicUrl,
                uploadedAt: new Date().toISOString()
            });

        } catch (err) {
            console.error("Upload error:", err);
            setError(`Failed to upload ${type.toUpperCase()}. Please try again.`);
        } finally {
            setUploadingType(null);
        }
    };

    const handleRemove = (type: 'coi' | 'w9') => {
        removeDocument(type);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Upload Required Documents</h2>
                        <p className="text-muted-foreground">
                            Upload your insurance and tax documents to complete verification
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Documents uploaded</span>
                        <span className="font-medium">{documents.length} / 2</span>
                    </div>
                    <Progress value={(documents.length / 2) * 100} className="h-2" />
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Document Cards */}
                <div className="space-y-4">
                    <DocumentCard
                        type="coi"
                        title="Certificate of Insurance (COI)"
                        description="General liability and cargo insurance proof"
                        uploaded={coiDoc ? { fileName: coiDoc.fileName, uploadedAt: coiDoc.uploadedAt } : undefined}
                        onUpload={(file) => handleUpload('coi', file)}
                        onRemove={() => handleRemove('coi')}
                        isUploading={uploadingType === 'coi'}
                    />

                    <DocumentCard
                        type="w9"
                        title="W-9 Tax Form"
                        description="IRS W-9 form for payment processing"
                        uploaded={w9Doc ? { fileName: w9Doc.fileName, uploadedAt: w9Doc.uploadedAt } : undefined}
                        onUpload={(file) => handleUpload('w9', file)}
                        onRemove={() => handleRemove('w9')}
                        isUploading={uploadingType === 'w9'}
                    />
                </div>

                {/* Continue Button */}
                <Button
                    size="lg"
                    className="w-full mt-6"
                    disabled={!documentsComplete}
                    onClick={completeDocuments}
                >
                    Continue to Bank Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Your documents are secure</p>
                        <p>All files are encrypted and stored securely. They will only be reviewed by Ship AI's verification team.</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
