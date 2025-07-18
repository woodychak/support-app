import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Ticket,
  MessageSquare,
  Clock,
  User,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  addTicketCommentAction,
  updateTicketStatusAction,
} from "../../../actions";
import { FormMessage, Message } from "@/components/form-message";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { ImagePasteTextarea } from "@/components/image-paste-textarea";
import { ImageViewerWrapper } from "@/components/image-viewer-wrapper";
import { ClickableImage } from "@/components/clickable-image";

function buildPublicUrl(filePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${filePath}`;
}

interface TicketManagementPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Message>;
}

type TicketAttachment = {
  id: string;
  file_path: string;
  publicUrl: string;
  file_name?: string;
  // 如果還有其他欄位，照填
};

export default async function TicketManagementPage({
  params,
  searchParams,
}: TicketManagementPageProps) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data with company info
  const { data: userData } = await supabase
    .from("users")
    .select("*, companies(*)")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return redirect("/dashboard");
  }

  // Get ticket data with client info
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select(
      `
      *,
      client_credentials(
        username,
        full_name,
        email
      )
    `,
    )
    .eq("id", id)
    .eq("company_id", userData.company_id)
    .single();

  if (ticketError || !ticket) {
    return redirect("/dashboard/tickets");
  }

  const { data: rawComments } = await supabase
    .from("ticket_comments")
    .select("*, ticket_attachments(*)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const comments =
    rawComments?.map((comment) => ({
      ...comment,
      attachments:
        comment.ticket_attachments?.map((att: TicketAttachment) => ({
          ...att,
          publicUrl: supabase.storage
            .from("attachments")
            .getPublicUrl(att.file_path).data.publicUrl,
        })) ?? [],
    })) ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-100 text-orange-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <ImageViewerWrapper />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Ticket Management</h1>
              <p className="text-muted-foreground">
                Handle and respond to support ticket
              </p>
            </div>
          </header>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Ticket className="h-6 w-6" />
                      {ticket.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Submitted by{" "}
                      {ticket.client_credentials?.full_name ||
                        ticket.client_credentials?.username ||
                        "Unknown Client"}{" "}
                      on {new Date(ticket.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">
                        {ticket.status.replace("_", " ")}
                      </span>
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Staff Name</h3>
                      <p className="text-gray-700">
                        {ticket.staff_name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Staff Email</h3>
                      <p className="text-gray-700">
                        {ticket.staff_email || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client Email:</span>{" "}
                      {ticket.client_credentials?.email || "Not provided"}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {ticket.updated_at
                        ? new Date(ticket.updated_at).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments && comments.length > 0 ? (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-lg ${
                            comment.author_type === "client"
                              ? "bg-blue-50 border-l-4 border-blue-200"
                              : comment.is_internal
                                ? "bg-yellow-50 border-l-4 border-yellow-200"
                                : "bg-green-50 border-l-4 border-green-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {comment.author_type === "client"
                                ? ticket.client_credentials?.full_name ||
                                  ticket.client_credentials?.username ||
                                  "Client"
                                : comment.is_internal
                                  ? "Internal Note"
                                  : "Support Team"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {comment.is_internal && (
                              <Badge variant="outline" className="text-xs">
                                Internal
                              </Badge>
                            )}
                            </div>
                            {comment.author_type === "staff" &&
                              comment.author_id === user.id && (
                                <DeleteCommentButton
                                  commentId={comment.id}
                                  ticketId={ticket.id}
                                  authorId={user.id}
                                  authorType="staff"
                                />
                              )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          {comment.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {comment.attachments.map((att: TicketAttachment) => (
                                <ClickableImage
                                  key={att.file_path}
                                  src={att.publicUrl}
                                  alt="Attachment"
                                  className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  fileName={att.file_name || "Attachment"}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No comments yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions Section */}
              <div className="space-y-6">
                {/* Status Update */}
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      action={updateTicketStatusAction}
                      className="space-y-4"
                    >
                      <input type="hidden" name="ticket_id" value={ticket.id} />
                      <div className="space-y-2">
                        <Label htmlFor="status">Ticket Status</Label>
                        <Select name="status" defaultValue={ticket.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">
                        Update Status
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Add Comment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Response</CardTitle>
                    <CardDescription>
                      Respond to the client or add internal notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={addTicketCommentAction} className="space-y-4">
                      <input type="hidden" name="ticket_id" value={ticket.id} />
                      <input type="hidden" name="author_type" value="staff" />
                      <input type="hidden" name="author_id" value={user.id} />

                      <div className="space-y-2">
                        <Label htmlFor="content">Comment *</Label>
                        <ImagePasteTextarea
                          id="content"
                          name="content"
                          placeholder="Type your response or internal note here..."
                          rows={4}
                          required
                          ticketId={ticket.id}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_internal"
                          name="is_internal"
                          value="true"
                          className="rounded"
                        />
                        <Label htmlFor="is_internal" className="text-sm">
                          Internal note (not visible to client)
                        </Label>
                      </div>
                      <div className="pt-2">
                        <Button type="submit" className="w-full">
                          Submit Comment
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
