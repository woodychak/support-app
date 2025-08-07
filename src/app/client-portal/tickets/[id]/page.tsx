import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";
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
} from "lucide-react";
import Link from "next/link";
import {
  updateSupportTicketAction,
  addTicketCommentAction,
} from "../../../actions";
import { FormMessage, Message } from "@/components/form-message";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { ImagePasteTextarea } from "@/components/image-paste-textarea";
import { ImageViewerWrapper } from "@/components/image-viewer-wrapper";
import { ClickableImage } from "@/components/clickable-image";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client_id?: string; session?: string } & Message>;
}
// 1️⃣ 先定義 attachment 的 Row 型別
type TicketAttachment = {
  id: string;
  file_path: string;
  publicUrl: string;
  file_name?: string;
  // 如果還有其他欄位，照填
};

export default async function TicketDetailPage({
  params,
  searchParams,
}: TicketDetailPageProps) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const clientId = searchParamsData.client_id;
  const sessionToken = searchParamsData.session;

  if (!clientId || !sessionToken) {
    return redirect("/client-portal");
  }

  const supabase = await createClient();

  // Verify session token
  const { data: sessionData, error: sessionError } = await supabase
    .from("client_sessions")
    .select("*")
    .eq("session_token", decodeURIComponent(sessionToken))
    .eq("client_id", clientId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (sessionError || !sessionData) {
    return redirect("/client-portal");
  }

  // Get client data
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("*, companies(*)")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !clientData) {
    return redirect("/client-portal");
  }

  // Get ticket data
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("client_credential_id", clientId)
    .single();

  if (ticketError || !ticket) {
    return redirect(
      `/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`,
    );
  }

  // Get ticket comments
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

  const canEdit = ticket.status === "open" || ticket.status === "in_progress";

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Enhanced security for client portal pages
            (function() {
              // Disable right-click context menu
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
              });
              
              // Disable keyboard shortcuts
              document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
                  e.preventDefault();
                }
                if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
                  e.preventDefault();
                }
                if (e.key === 'F12') {
                  e.preventDefault();
                }
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                  e.preventDefault();
                }
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                  e.preventDefault();
                }
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                  e.preventDefault();
                }
              });
            })();
          `,
        }}
      />
      <ImageViewerWrapper />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
              >
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ticket Details
                </h1>
                <p className="text-gray-600">
                  {clientData.companies?.name} Support Portal
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      {ticket.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Created on{" "}
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {ticket.description}
                    </p>
                  </div>
                  {ticket.updated_at &&
                    ticket.updated_at !== ticket.created_at && (
                      <div className="text-sm text-gray-500">
                        Last updated:{" "}
                        {new Date(ticket.updated_at).toLocaleString()}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-l-4 border-blue-200 pl-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {comment.author_type === "client"
                                ? "You"
                                : "Support Team"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          {comment.author_type === "client" &&
                            comment.author_id === clientId && (
                              <DeleteCommentButton
                                commentId={comment.id}
                                ticketId={ticket.id}
                                authorId={clientId}
                                authorType="client"
                                clientId={clientId}
                              />
                            )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>

                        {/* 👇 新增：圖片預覽 */}
                        {comment.attachments &&
                          comment.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {comment.attachments.map(
                                (att: {
                                  file_path: string;
                                  publicUrl: string;
                                }) => (
                                  <ClickableImage
                                    key={att.file_path}
                                    src={att.publicUrl}
                                    alt="Attachment"
                                    className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    fileName={
                                      att.file_path.split("/").pop() ||
                                      "Attachment"
                                    }
                                  />
                                ),
                              )}
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

                {/* Add comment form */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">Add Comment</h3>
                  <form action={addTicketCommentAction} className="space-y-4">
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="author_type" value="client" />
                    <input type="hidden" name="author_id" value={clientId} />
                    <input type="hidden" name="is_internal" value="false" />

                    <div className="space-y-2">
                      <ImagePasteTextarea
                        id="content"
                        name="content"
                        placeholder="Type your comment here..."
                        rows={3}
                        required
                        ticketId={ticket.id}
                      />
                    </div>

                    <Button type="submit" className="w-full sm:w-auto">
                      Add Comment
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Ticket</CardTitle>
                  <CardDescription>
                    You can edit this ticket while it's still open or in
                    progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action={updateSupportTicketAction}
                    className="space-y-6"
                  >
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="client_id" value={clientId} />

                    <div className="space-y-2">
                      <Label htmlFor="title">Subject *</Label>
                      <Input
                        id="title"
                        name="title"
                        type="text"
                        defaultValue={ticket.title}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select
                        name="priority"
                        defaultValue={ticket.priority}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            Low - General inquiry
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium - Issue affecting work
                          </SelectItem>
                          <SelectItem value="high">
                            High - Critical issue
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={ticket.description}
                        rows={6}
                        required
                      />
                    </div>

                    <FormMessage message={searchParamsData} />

                    <div className="flex gap-4">
                      <Button type="submit">Update Ticket</Button>
                      <Link
                        href={`/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                      >
                        <Button variant="outline">Back to Dashboard</Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {!canEdit && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      This ticket cannot be edited because it has been{" "}
                      {ticket.status}.
                    </p>
                    <Link
                      href={`/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                    >
                      <Button variant="outline" className="mt-4">
                        Back to Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
