import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default async function CompanyTicketsPage() {
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

  // Get all tickets for the company
  const { data: tickets } = await supabase
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
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false });

  const ticketStats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
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
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">
              Manage and track all support tickets for{" "}
              {userData.companies?.name}
            </p>
          </header>

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

          {/* Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>All Support Tickets</CardTitle>
              <CardDescription>
                View and manage all client-submitted support tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!tickets || tickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tickets yet
                  </h3>
                  <p className="text-gray-600">
                    When clients submit support tickets, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {ticket.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">
                              {ticket.status.replace("_", " ")}
                            </span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(ticket.priority)}
                          >
                            {ticket.priority} priority
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {ticket.client_credentials?.full_name ||
                                ticket.client_credentials?.username ||
                                "Unknown Client"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
