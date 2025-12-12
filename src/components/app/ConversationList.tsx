import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
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
    <div className="flex flex-col h-full">
      {/* Conversations list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {conversations.map((conversation) => (
          <Card
            key={conversation.loadId}
            className={cn(
              "p-3 cursor-pointer transition-all hover:shadow-md",
              selectedLoadId === conversation.loadId && "border-primary bg-primary/5"
            )}
            onClick={() => onSelectConversation(conversation.loadId, conversation.otherUserId)}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  Load #{conversation.load?.load_number || conversation.loadId.slice(0, 8)}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.load?.origin_city}, {conversation.load?.origin_state} →{" "}
                  {conversation.load?.destination_city}, {conversation.load?.destination_state}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="shrink-0">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {conversation.latestMessage.message}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {format(new Date(conversation.latestMessage.created_at), "MMM dd, h:mm a")}
              </span>
              <Badge variant="outline" className="text-xs">
                {conversation.load?.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination at bottom */}
      <div className="pt-4 mt-auto border-t flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {totalCount} total
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-7 px-2 text-xs"
          >
            Previous
          </Button>
          <span className="text-xs px-2">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasMore}
            className="h-7 px-2 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
