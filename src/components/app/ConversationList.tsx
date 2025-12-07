import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  loadId: string;
  load: any;
  latestMessage: any;
  otherUserId: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedLoadId: string | null;
  onSelectConversation: (loadId: string, otherUserId: string) => void;
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  totalCount: number;
}

export function ConversationList({
  conversations,
  selectedLoadId,
  onSelectConversation,
  currentPage,
  hasMore,
  onPageChange,
  totalCount,
}: ConversationListProps) {
  if (conversations.length === 0 && currentPage === 1) {
    return (
      <Card className="p-12 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-muted-foreground">
          Messages will appear here when you communicate with bidders
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} conversation{totalCount !== 1 ? 's' : ''} total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations list */}
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.loadId}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selectedLoadId === conversation.loadId && "border-primary bg-primary/5"
            )}
            onClick={() => onSelectConversation(conversation.loadId, conversation.otherUserId)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Load #{conversation.load?.load_number || conversation.loadId.slice(0, 8)}
                </h3>
                <p className="text-xs text-muted-foreground mb-1">
                  {conversation.load?.origin_city}, {conversation.load?.origin_state} →{" "}
                  {conversation.load?.destination_city}, {conversation.load?.destination_state}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {conversation.latestMessage.message}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(conversation.latestMessage.created_at), "MMM dd, h:mm a")}
              </span>
              <Badge variant="outline" className="text-xs">
                {conversation.load?.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
