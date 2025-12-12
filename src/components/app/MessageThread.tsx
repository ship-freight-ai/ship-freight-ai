import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { FileText, Download, DollarSign, Truck, ExternalLink, CheckCheck, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useConversationBid } from "@/hooks/useConversationBid";
import { useAcceptBid, useRejectBid } from "@/hooks/useBids";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Message = Database["public"]["Tables"]["messages"]["Row"];

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  loadId: string | null;
  otherUserId: string | null;
}

export function MessageThread({ messages, currentUserId, loadId, otherUserId }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: conversationData } = useConversationBid(loadId, otherUserId);
  const acceptBid = useAcceptBid();
  const rejectBid = useRejectBid();

  // Get current user's role
  const { data: profile } = useQuery({
    queryKey: ["profile-role"],
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

  const isShipper = profile?.role === "shipper";
  const bidIsPending = conversationData?.bid?.status === "pending";
  const canApproveBid = isShipper && bidIsPending && conversationData?.bid;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAcceptBid = () => {
    if (!conversationData?.bid || !loadId || !otherUserId) return;
    acceptBid.mutate({
      bidId: conversationData.bid.id,
      loadId,
      carrierId: otherUserId,
    });
  };

  const handleRejectBid = () => {
    if (!conversationData?.bid || !loadId) return;
    rejectBid.mutate({ bidId: conversationData.bid.id, loadId });
  };

  const isProcessing = acceptBid.isPending || rejectBid.isPending;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with bid information */}
      {conversationData?.bid && (
        <Card className="m-4 mb-0 bg-accent/50 shrink-0">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Bid Amount */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bid Amount</p>
                  <p className="font-bold text-xl">
                    ${conversationData.bid.bid_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Load Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Load #{conversationData.load.load_number}</p>
                  <p className="font-medium text-sm">
                    {conversationData.load.origin_city}, {conversationData.load.origin_state} →{" "}
                    {conversationData.load.destination_city}, {conversationData.load.destination_state}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant={conversationData.bid.status === "accepted" ? "default" :
                  conversationData.bid.status === "rejected" ? "destructive" : "secondary"}
                className="text-sm"
              >
                {conversationData.bid.status}
              </Badge>

              {/* Accept/Reject Buttons for Shipper */}
              {canApproveBid && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAcceptBid}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    {acceptBid.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Accept Bid
                  </Button>
                  <Button
                    onClick={handleRejectBid}
                    disabled={isProcessing}
                    variant="destructive"
                    size="sm"
                  >
                    {rejectBid.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-1" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId;

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                isOwn ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

                {message.attachment_url && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <a
                      href={message.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View attachment</span>
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-1 px-1">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(message.created_at), "MMM dd, h:mm a")}
                </span>
                {isOwn && (
                  <CheckCheck
                    className={cn(
                      "w-3 h-3",
                      message.read ? "text-blue-500" : "text-muted-foreground/50"
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
