"use client";

import { Trash2 } from "lucide-react";
import { deleteSupportTicketAction } from "@/app/actions";
import { useState } from "react";

interface DeleteTicketButtonProps {
  ticketId: string;
  clientId: string;
  ticketTitle: string;
}

export function DeleteTicketButton({
  ticketId,
  clientId,
  ticketTitle,
}: DeleteTicketButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the ticket "${ticketTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    const formData = new FormData();
    formData.append("ticket_id", ticketId);
    formData.append("client_id", clientId);

    try {
      await deleteSupportTicketAction(formData);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
