import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { createCompanyAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Building2 } from "lucide-react";

interface CompanyPageProps {
  searchParams: Promise<Message>;
}

export default async function CompanyPage({ searchParams }: CompanyPageProps) {
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
    .select("*, companies(*)")
    .eq("id", user.id)
    .single();

  const hasCompany = !!userData?.company_id;

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Company Profile
            </h1>
          </header>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>
                {hasCompany
                  ? "Update Company Information"
                  : "Create Company Profile"}
              </CardTitle>
              <CardDescription>
                {hasCompany
                  ? "Manage your company details and settings."
                  : "Set up your company profile to start managing support tickets and client credentials."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your Company Name"
                    defaultValue={userData?.companies?.name || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of your company..."
                    defaultValue={userData?.companies?.description || ""}
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <SubmitButton
                    formAction={createCompanyAction}
                    pendingText={hasCompany ? "Updating..." : "Creating..."}
                  >
                    {hasCompany ? "Update Company" : "Create Company"}
                  </SubmitButton>
                </div>

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {hasCompany && (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Current company details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Company Name
                    </Label>
                    <p className="text-sm">{userData?.companies?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Description
                    </Label>
                    <p className="text-sm">
                      {userData?.companies?.description ||
                        "No description provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created
                    </Label>
                    <p className="text-sm">
                      {new Date(
                        userData?.companies?.created_at || "",
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
