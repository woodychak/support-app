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
import { TicketDashboardClient } from "@/components/ticket-dashboard-client";

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
        id,
        username,
        full_name,
        email
      )
    `,
    )
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false });

  // Get unique clients for filter dropdown
  const { data: clients } = await supabase
    .from("client_credentials")
    .select("id, username, full_name, email")
    .eq("company_id", userData.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const ticketStats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
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

          {/* Client Component for Tickets with Filters */}
          <TicketDashboardClient
            tickets={tickets || []}
            clients={clients || []}
          />
        </div>
      </main>
    </>
  );
}
