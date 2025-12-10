import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { FileText, Download, DollarSign, Truck, ExternalLink, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useConversationBid } from "@/hooks/useConversationBid";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with bid information */}
      {conversationData?.bid && (
        <Card className="mb-4 bg-accent/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Bid Amount</p>
                  <p className="font-semibold text-lg">
                    ${conversationData.bid.bid_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Load #{conversationData.load.load_number}</p>
                  <p className="font-medium text-sm">
                    {conversationData.load.origin_city}, {conversationData.load.origin_state} →{" "}
                    {conversationData.load.destination_city}, {conversationData.load.destination_state}
                  </p>
                </div>
              </div>

              {conversationData.bid.tracking_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <a
                      href={conversationData.bid.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View Tracking <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant={conversationData.bid.status === "accepted" ? "default" : "secondary"}>
                  {conversationData.bid.status}
                </Badge>
              </div>
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
