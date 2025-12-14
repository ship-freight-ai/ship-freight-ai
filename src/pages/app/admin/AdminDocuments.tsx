/**
 * Admin Document Verification Page
 * 
 * Allows admins to review, approve, or reject carrier documents (COI, W-9).
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/app/BackButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Eye,
    Download,
    Building,
    AlertCircle
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CarrierDocument {
    id: string;
    user_id: string;
    file_url: string;
    file_name: string;
    document_type: string;
    approved: boolean;
    rejected_reason: string | null;
    created_at: string;
    carrier: {
        company_name: string;
        mc_number: string | null;
        dot_number: string | null;
    } | null;
    profile: {
        email: string;
        full_name: string | null;
    } | null;
}

export default function AdminDocuments() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDoc, setSelectedDoc] = useState<CarrierDocument | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

    // Fetch all carrier documents pending review
    const { data: documents, isLoading } = useQuery({
        queryKey: ["admin-carrier-documents"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("documents")
                .select(`
                    *,
                    carrier:carriers!documents_user_id_fkey(company_name, mc_number, dot_number),
                    profile:profiles!documents_user_id_fkey(email, full_name)
                `)
                .in("document_type", ["insurance", "other"])
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as CarrierDocument[];
        },
    });

    // Approve document mutation
    const approveMutation = useMutation({
        mutationFn: async (docId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from("documents")
                .update({
                    approved: true,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                    rejected_reason: null,
                })
                .eq("id", docId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-carrier-documents"] });
            toast({ title: "Document approved", description: "The document has been approved successfully." });
        },
    });

    // Reject document mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
            const { error } = await supabase
                .from("documents")
                .update({
                    approved: false,
                    rejected_reason: reason,
                })
                .eq("id", docId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-carrier-documents"] });
            setRejectDialogOpen(false);
            setRejectReason("");
            setSelectedDoc(null);
            toast({ title: "Document rejected", description: "The carrier has been notified." });
        },
    });

    const filteredDocs = documents?.filter((doc) =>
        doc.carrier?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingDocs = filteredDocs?.filter((doc) => !doc.approved && !doc.rejected_reason);
    const approvedDocs = filteredDocs?.filter((doc) => doc.approved);
    const rejectedDocs = filteredDocs?.filter((doc) => doc.rejected_reason);

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case "insurance": return "COI";
            case "other": return "W-9";
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <BackButton to="/app/admin/dashboard" />
                    <h1 className="text-3xl font-bold mt-2">Document Verification</h1>
                    <p className="text-muted-foreground">Review and approve carrier documents</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingDocs?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Pending Review</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{approvedDocs?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{rejectedDocs?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Rejected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Documents Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Documents</CardTitle>
                    <CardDescription>COI and W-9 documents from carriers</CardDescription>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by carrier, email, or file..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : filteredDocs?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No documents found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Carrier</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs?.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{doc.carrier?.company_name || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.profile?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm truncate max-w-[150px]">{doc.file_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getDocTypeLabel(doc.document_type)}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(doc.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {doc.approved ? (
                                                <Badge className="bg-green-600">Approved</Badge>
                                            ) : doc.rejected_reason ? (
                                                <Badge variant="destructive">Rejected</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => window.open(doc.file_url, "_blank")}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {!doc.approved && !doc.rejected_reason && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600"
                                                            onClick={() => approveMutation.mutate(doc.id)}
                                                            disabled={approveMutation.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setSelectedDoc(doc);
                                                                setRejectDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Document</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this document. The carrier will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Reason for rejection (e.g., 'Document is expired', 'Image is not legible')"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedDoc && rejectReason) {
                                    rejectMutation.mutate({ docId: selectedDoc.id, reason: rejectReason });
                                }
                            }}
                            disabled={!rejectReason || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? "Rejecting..." : "Reject Document"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
