import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { useUserDocuments } from "@/hooks/useDocuments";
import DocumentUploadDialog from "@/components/app/DocumentUploadDialog";
import DocumentCard from "@/components/app/DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AppDocuments() {
  const { data: documents, isLoading } = useUserDocuments();
  
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data?.role || null;
    },
  });

  const isAdmin = userRole === "admin";
  const isShipper = profile?.role === "shipper";

  const pendingDocs = documents?.filter((d) => d.approved === null) || [];
  const approvedDocs = documents?.filter((d) => d.approved === true) || [];
  const rejectedDocs = documents?.filter((d) => d.approved === false) || [];

  const stats = [
    {
      label: "Total Documents",
      value: documents?.length || 0,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Pending Review",
      value: pendingDocs.length,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Approved",
      value: approvedDocs.length,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Rejected",
      value: rejectedDocs.length,
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Documents</h1>
          <DocumentUploadDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Documents List */}
        {!documents || documents.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Upload className="w-16 h-16 text-accent mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No documents yet</h2>
            <p className="text-muted-foreground mb-6">
              Upload POD, BOL, COI, or other supporting documents
            </p>
            <DocumentUploadDialog trigger={
              <button className="btn-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload First Document
              </button>
            } />
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <Badge variant="secondary" className="ml-2">{pendingDocs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved
                <Badge variant="secondary" className="ml-2">{approvedDocs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
                <Badge variant="secondary" className="ml-2">{rejectedDocs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {documents.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  isAdmin={isAdmin}
                  isShipper={isShipper}
                  loadId={doc.load_id || undefined}
                />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {pendingDocs.length === 0 ? (
                <Card className="p-8 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending documents</p>
                </Card>
              ) : (
                pendingDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    document={doc} 
                    isAdmin={isAdmin}
                    isShipper={isShipper}
                    loadId={doc.load_id || undefined}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-6">
              {approvedDocs.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved documents</p>
                </Card>
              ) : (
                approvedDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    document={doc} 
                    isAdmin={isAdmin}
                    isShipper={isShipper}
                    loadId={doc.load_id || undefined}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-6">
              {rejectedDocs.length === 0 ? (
                <Card className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rejected documents</p>
                </Card>
              ) : (
                rejectedDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    document={doc} 
                    isAdmin={isAdmin}
                    isShipper={isShipper}
                    loadId={doc.load_id || undefined}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
