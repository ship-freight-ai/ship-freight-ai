import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Send, Inbox } from "lucide-react";
import { useConversations, useLoadMessages, useSendMessage, useMarkAllMessagesRead } from "@/hooks/useMessages";
import { ConversationList } from "@/components/app/ConversationList";
import { MessageThread } from "@/components/app/MessageThread";
import { MessageInput } from "@/components/app/MessageInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

function AppMessagesContent() {
  const [searchParams] = useSearchParams();
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(searchParams.get("loadId"));
  const [receiverId, setReceiverId] = useState<string | null>(searchParams.get("userId"));
  const [currentPage, setCurrentPage] = useState(1);

  const { data: conversationsData, isLoading: loadingConversations } = useConversations(currentPage, 20);
  const { data: messages, isLoading: loadingMessages } = useLoadMessages(selectedLoadId);
  const sendMessage = useSendMessage();
  const markAllRead = useMarkAllMessagesRead();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedLoadId && messages && currentUser) {
      const unreadMessages = messages.filter(
        (m) => m.receiver_id === currentUser.id && !m.read
      );
      if (unreadMessages.length > 0) {
        markAllRead.mutate(selectedLoadId);
      }
    }
  }, [selectedLoadId, messages, currentUser]);

  const handleSelectConversation = (loadId: string, otherUserId: string) => {
    setSelectedLoadId(loadId);
    setReceiverId(otherUserId);
  };

  const handleSendMessage = (message: string, attachmentUrl?: string) => {
    if (!selectedLoadId || !receiverId) return;

    sendMessage.mutate({
      load_id: selectedLoadId,
      receiver_id: receiverId,
      message,
      attachment_url: attachmentUrl || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with carriers and shippers in real-time</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 h-[calc(100vh-250px)]">
            <div className="p-4 border-b border-border/50">
              <h2 className="font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Inbox className="w-4 h-4 text-primary" />
                </div>
                Conversations
              </h2>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              {loadingConversations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <ConversationList
                  conversations={conversationsData?.conversations || []}
                  selectedLoadId={selectedLoadId}
                  onSelectConversation={handleSelectConversation}
                  currentPage={currentPage}
                  hasMore={conversationsData?.hasMore || false}
                  onPageChange={setCurrentPage}
                  totalCount={conversationsData?.totalCount || 0}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-250px)] flex flex-col">
            {selectedLoadId ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLoadId(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h2 className="font-semibold">
                      {conversationsData?.conversations.find((c) => c.loadId === selectedLoadId)?.load?.origin_city},{" "}
                      {conversationsData?.conversations.find((c) => c.loadId === selectedLoadId)?.load?.origin_state} →{" "}
                      {conversationsData?.conversations.find((c) => c.loadId === selectedLoadId)?.load?.destination_city},{" "}
                      {conversationsData?.conversations.find((c) => c.loadId === selectedLoadId)?.load?.destination_state}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Load #{conversationsData?.conversations.find((c) => c.loadId === selectedLoadId)?.load?.load_number || selectedLoadId.slice(0, 8)}
                    </p>
                  </div>
                </div>

                {loadingMessages ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : (
                  <MessageThread
                    messages={messages || []}
                    currentUserId={currentUser?.id || ""}
                    loadId={selectedLoadId}
                    otherUserId={receiverId}
                  />
                )}

                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!receiverId}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">
                    Select a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

export default function AppMessages() {
  return (
    <ErrorBoundary>
      <AppMessagesContent />
    </ErrorBoundary>
  );
}
