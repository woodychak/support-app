import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  FileText,
  Monitor,
} from "lucide-react";
import { DeleteTicketButton } from "@/components/delete-ticket-button";
import Link from "next/link";
import { clientSignOutAction } from "@/app/actions";

interface ClientDashboardProps {
  searchParams: Promise<{
    client_id?: string;
    show_closed?: string;
    role?: string;
    session?: string;
  }>;
}

export default async function ClientDashboard({
  searchParams,
}: ClientDashboardProps) {
  const params = await searchParams;
  const clientId = params.client_id;
  const showClosed = params.show_closed === "true";
  const userRole = params.role || "user";
  const sessionToken = params.session;

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
  const { data: clientData, error } = await supabase
    .from("client_credentials")
    .select("*, companies(*), client_company_profiles(*)")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (error || !clientData) {
    return redirect("/client-portal");
  }

  // Get client's tickets (exclude closed by default)
  let ticketsQuery = supabase
    .from("support_tickets")
    .select("*")
    .eq("client_credential_id", clientId);

  if (!showClosed) {
    ticketsQuery = ticketsQuery.neq("status", "closed");
  }

  const { data: tickets } = await ticketsQuery.order("created_at", {
    ascending: false,
  });

  // Get closed tickets count for the button
  const { data: closedTickets } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("client_credential_id", clientId)
    .eq("status", "closed");

  const ticketStats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
    closed: closedTickets?.length || 0,
  };

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
              
              // Disable text selection on sensitive elements
              document.addEventListener('selectstart', function(e) {
                if (e.target.closest('.sensitive-data')) {
                  e.preventDefault();
                }
              });
              
              // Disable keyboard shortcuts
              document.addEventListener('keydown', function(e) {
                // Prevent Ctrl+L (address bar focus)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+U (view source)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
                  e.preventDefault();
                }
                // Prevent F12 (dev tools)
                if (e.key === 'F12') {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+I (dev tools)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+J (console)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+C (element inspector)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                  e.preventDefault();
                }
              });
              
              // Session timeout warning
              let sessionWarningShown = false;
              setTimeout(function() {
                if (!sessionWarningShown) {
                  sessionWarningShown = true;
                  if (confirm('Your session will expire in 5 minutes. Click OK to stay logged in or Cancel to sign out now.')) {
                    // Refresh the page to extend session
                    window.location.reload();
                  } else {
                    // Sign out
                    window.location.href = '/client-portal';
                  }
                }
              }, 19 * 60 * 1000); // 19 minutes (5 minutes before 24-hour expiry)
              
              // Auto sign-out after 24 hours
              setTimeout(function() {
                alert('Your session has expired. You will be redirected to the login page.');
                window.location.href = '/client-portal';
              }, 24 * 60 * 60 * 1000); // 24 hours
            })();
          `,
        }}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {clientData.full_name || clientData.username}
                </h1>
                <p className="text-gray-600">
                  {clientData.companies?.name} Support Portal
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/client-portal/tickets/new?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                >
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </Link>
                <Link
                  href={`/client-portal/onsite-support?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                >
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Onsite Reports
                  </Button>
                </Link>
                <Link
                  href={`/client-portal/equipment?client_id=${clientId}&role=${userRole}&session=${encodeURIComponent(sessionToken)}`}
                >
                  <Button variant="outline">
                    <Monitor className="h-4 w-4 mr-2" />
                    Equipment
                  </Button>
                </Link>
                {!showClosed && ticketStats.closed > 0 && (
                  <Link
                    href={`/client-portal/dashboard?client_id=${clientId}&show_closed=true&role=${userRole}&session=${encodeURIComponent(sessionToken)}`}
                  >
                    <Button variant="outline">
                      <Archive className="h-4 w-4 mr-2" />
                      Show Closed ({ticketStats.closed})
                    </Button>
                  </Link>
                )}
                {showClosed && (
                  <Link
                    href={`/client-portal/dashboard?client_id=${clientId}&role=${userRole}&session=${encodeURIComponent(sessionToken)}`}
                  >
                    <Button variant="outline">Hide Closed</Button>
                  </Link>
                )}
                <form action={clientSignOutAction} className="inline">
                  <input
                    type="hidden"
                    name="session_token"
                    value={sessionToken}
                  />
                  <Button type="submit" variant="destructive" size="sm">
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Tickets
                      </p>
                      <p className="text-2xl font-bold">{ticketStats.total}</p>
                    </div>
                    <Ticket className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {ticketStats.open}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {ticketStats.inProgress}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Resolved
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {ticketStats.resolved}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Your Support Tickets
                  {showClosed && " (Including Closed)"}
                </CardTitle>
                <CardDescription>
                  {showClosed
                    ? "All your support requests including closed tickets"
                    : "Track the status of your active support requests"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!tickets || tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tickets yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first support ticket to get help from our
                      team.
                    </p>
                    <Link
                      href={`/client-portal/tickets/new?client_id=${clientId}&role=${userRole}&session=${encodeURIComponent(sessionToken)}`}
                    >
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">
                            {ticket.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">
                                {ticket.status.replace("_", " ")}
                              </span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Created{" "}
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/client-portal/tickets/${ticket.id}?client_id=${clientId}&role=${userRole}&session=${encodeURIComponent(sessionToken)}`}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              View Details
                            </Link>
                            {(ticket.status === "open" ||
                              ticket.status === "in_progress") && (
                              <DeleteTicketButton
                                ticketId={ticket.id}
                                clientId={clientId}
                                ticketTitle={ticket.title}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
