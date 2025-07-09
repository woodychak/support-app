"use client";

import { Trash2 } from "lucide-react";
import { deleteTicketCommentAction } from "@/app/actions";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeleteCommentButtonProps {
  commentId: string;
  ticketId: string;
  authorId: string;
  authorType: "client" | "staff";
  clientId?: string;
  size?: "sm" | "xs";
}

export function DeleteCommentButton({
  commentId,
  ticketId,
  authorId,
  authorType,
  clientId,
  size = "xs",
}: DeleteCommentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this comment? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);

    const formData = new FormData();
    formData.append("comment_id", commentId);
    formData.append("ticket_id", ticketId);
    formData.append("author_id", authorId);
    formData.append("author_type", authorType);
    if (clientId) {
      formData.append("client_id", clientId);
    }

    try {
      await deleteTicketCommentAction(formData);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={"sm"}
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
    >
      <Trash2 className="h-3 w-3" />
      {isDeleting && <span className="ml-1 text-xs">Deleting...</span>}
    </Button>
  );
}
