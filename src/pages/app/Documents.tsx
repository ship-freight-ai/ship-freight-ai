import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, XCircle, Clock, FolderOpen } from "lucide-react";
import { useUserDocuments } from "@/hooks/useDocuments";
import DocumentUploadDialog from "@/components/app/DocumentUploadDialog";
import DocumentCard from "@/components/app/DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

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
      bg: "bg-primary/10",
    },
    {
      label: "Pending Review",
      value: pendingDocs.length,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Approved",
      value: approvedDocs.length,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Rejected",
      value: rejectedDocs.length,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage PODs, BOLs, COIs, and other freight documents
          </p>
        </div>
        <DocumentUploadDialog />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

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
  );
}
