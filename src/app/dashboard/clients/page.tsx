import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { createClientCredentialAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Users, Plus, User, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientsPageProps {
  searchParams: Promise<Message>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = await createClient();
  const message = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data with company info
  const { data: userData } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return redirect("/dashboard/company");
  }

  // Get existing client credentials
  const { data: clientCredentials } = await supabase
    .from("client_credentials")
    .select("*")
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Client Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage client login credentials for your support
              portal.
            </p>
          </header>

          {/* Create New Client */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Client Credential
              </CardTitle>
              <CardDescription>
                Generate login credentials for clients to access their support
                portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="client_username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Secure password"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Client's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <SubmitButton
                  formAction={createClientCredentialAction}
                  pendingText="Creating..."
                >
                  Create Client Credential
                </SubmitButton>

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {/* Existing Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Client Credentials</CardTitle>
              <CardDescription>
                {clientCredentials?.length || 0} client credentials created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!clientCredentials || clientCredentials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No client credentials created yet.</p>
                  <p className="text-sm">
                    Create your first client credential above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientCredentials.map((client) => (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{client.username}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {client.full_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {client.full_name}
                                </span>
                              )}
                              {client.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  client.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={client.is_active ? "default" : "secondary"}
                          >
                            {client.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Portal Access */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Client Portal Access</CardTitle>
              <CardDescription>
                Share this link with your clients to access their support
                portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "https://your-domain.com"}
                  /client-portal
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Clients can use their username and password to log in and submit
                support tickets.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
