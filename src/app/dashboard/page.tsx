import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  Building2,
  Users,
  Ticket,
  Plus,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data with company info
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, companies(*)")
    .eq("id", user.id)
    .single();

  // If user doesn't exist in users table, create it
  if (userError && userError.code === "PGRST116") {
    const { error: createUserError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      name: user.user_metadata?.full_name || "",
      token_identifier: user.id,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    if (createUserError) {
      console.error("Error creating user record:", createUserError);
    }

    // Retry getting user data
    const { data: newUserData } = await supabase
      .from("users")
      .select("*, companies(*)")
      .eq("id", user.id)
      .single();

    // Use the newly created user data
    const userData = newUserData;
  }

  // Get company stats if user has a company
  let companyStats = null;
  if (userData?.company_id) {
    const [clientsResult, ticketsResult] = await Promise.all([
      supabase
        .from("client_credentials")
        .select("id")
        .eq("company_id", userData.company_id)
        .eq("is_active", true),
      supabase
        .from("support_tickets")
        .select("id, status")
        .eq("company_id", userData.company_id),
    ]);

    companyStats = {
      totalClients: clientsResult.data?.length || 0,
      totalTickets: ticketsResult.data?.length || 0,
      openTickets:
        ticketsResult.data?.filter((t) => t.status === "open").length || 0,
      resolvedTickets:
        ticketsResult.data?.filter((t) => t.status === "resolved").length || 0,
    };
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Welcome to your ASSA Support Dashboard</span>
            </div>
          </header>

          {/* Company Section */}
          {!userData?.company_id ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Setup Required
                </CardTitle>
                <CardDescription>
                  Create your company profile to start managing support tickets
                  and client credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/company">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Company Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {userData.companies?.name}
                  </CardTitle>
                  <CardDescription>
                    {userData.companies?.description ||
                      "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Link href="/dashboard/company">
                      <Button variant="outline">Edit Company</Button>
                    </Link>
                    <Link href="/dashboard/clients">
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Clients
                      </Button>
                    </Link>
                    <Link href="/dashboard/tickets">
                      <Button variant="outline">
                        <Ticket className="h-4 w-4 mr-2" />
                        View Tickets
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              {companyStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Clients
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {companyStats.totalClients}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Tickets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {companyStats.totalTickets}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Open Tickets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {companyStats.openTickets}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Resolved Tickets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {companyStats.resolvedTickets}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
