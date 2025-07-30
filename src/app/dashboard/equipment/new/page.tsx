import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Monitor, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EquipmentForm } from "@/components/equipment-form";
import { Toaster } from "@/components/ui/toaster";

export default async function NewEquipmentPage() {
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
    .select("company_id, user_type")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return redirect("/dashboard");
  }

  // Get clients for the form
  const { data: clients } = await supabase
    .from("client_credentials")
    .select("id, username, full_name, email")
    .eq("company_id", userData.company_id)
    .eq("is_active", true)
    .order("full_name");

  return (
    <>
      <DashboardNavbar />
      <Toaster />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/equipment">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Equipment
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Monitor className="h-8 w-8" />
                  Add New Equipment
                </h1>
                <p className="text-muted-foreground mt-2">
                  Add a new device to the equipment inventory
                </p>
              </div>
            </div>
          </header>

          {/* Form */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
              <CardDescription>
                Enter the details for the new equipment item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentForm clients={clients || []} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
