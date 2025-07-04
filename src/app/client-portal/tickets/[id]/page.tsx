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
import { ArrowLeft, Ticket, MessageSquare, Clock, User } from "lucide-react";
import Link from "next/link";
import { updateSupportTicketAction } from "../../../actions";
import { FormMessage, Message } from "@/components/form-message";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client_id?: string } & Message>;
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: TicketDetailPageProps) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const clientId = searchParamsData.client_id;

  if (!clientId) {
    return redirect("/client-portal");
  }

  const supabase = await createClient();

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
    return redirect(`/client-portal/dashboard?client_id=${clientId}`);
  }

  // Get ticket comments
  const { data: comments } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", id)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/client-portal/dashboard?client_id=${clientId}`}>
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
          {comments && comments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-l-4 border-blue-200 pl-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
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
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Ticket</CardTitle>
                <CardDescription>
                  You can edit this ticket while it's still open or in progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateSupportTicketAction} className="space-y-6">
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
                      href={`/client-portal/dashboard?client_id=${clientId}`}
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
                  <Link href={`/client-portal/dashboard?client_id=${clientId}`}>
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
  );
}
