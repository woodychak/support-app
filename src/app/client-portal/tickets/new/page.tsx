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
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";
import { createSupportTicketAction } from "../../../actions";
import { FormMessage, Message } from "@/components/form-message";

interface NewTicketPageProps {
  searchParams: Promise<{ client_id?: string; session?: string } & Message>;
}

export default async function NewTicketPage({
  searchParams,
}: NewTicketPageProps) {
  const params = await searchParams;
  const clientId = params.client_id;
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
    .select("*, companies(*)")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (error || !clientData) {
    return redirect("/client-portal");
  }

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
                  Create Support Ticket
                </h1>
                <p className="text-gray-600">
                  {clientData.companies?.name} Support Portal
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  New Support Request
                </CardTitle>
                <CardDescription>
                  Describe your issue and we'll help you resolve it as quickly
                  as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createSupportTicketAction} className="space-y-6">
                  <input type="hidden" name="client_id" value={clientId} />

                  <div className="space-y-2">
                    <Label htmlFor="title">Subject *</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
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
                    <Label htmlFor="staff_name">Staff Name *</Label>
                    <Input
                      id="staff_name"
                      name="staff_name"
                      type="text"
                      placeholder="Name of the staff member you're reporting about"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff_email">Staff Email *</Label>
                    <Input
                      id="staff_email"
                      name="staff_email"
                      type="email"
                      placeholder="Email of the staff member"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Tips for better support:
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • Download SOS from{" "}
                        <a
                          href="https://sos.splashtop.com/"
                          style={{
                            color: "#007BFF",
                            textDecoration: "underline",
                            fontWeight: "bold",
                          }}
                          target="_blank"
                        >
                          HERE
                        </a>
                      </li>
                      <li>• Be specific about what you were trying to do</li>
                      <li>• Include any error messages you received</li>
                      <li>• Mention your browser/device if relevant</li>
                      <li>• Attach screenshots if helpful</li>
                    </ul>
                  </div>

                  <FormMessage message={params} />

                  <div className="flex gap-4">
                    <Button type="submit">Submit Ticket</Button>
                    <Link
                      href={`/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                    >
                      <Button variant="outline">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
