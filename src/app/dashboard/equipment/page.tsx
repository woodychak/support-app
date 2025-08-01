import DashboardNavbar from "@/components/dashboard-navbar";
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
import { Plus, Monitor, Download } from "lucide-react";
import Link from "next/link";
import { EquipmentTable } from "@/components/equipment-table";
import { EquipmentExport } from "@/components/equipment-export";
import { EquipmentExportResults } from "@/components/equipment-export-results";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { decrypt } from "@/utils/encryption";

export default async function EquipmentPage({
  searchParams,
}: EquipmentPageProps) {
  const params = await searchParams;
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

  // Get equipment inventory
  const { data: equipment } = await supabase
    .from("equipment_inventory")
    .select(
      `
      *,
      client_company_profiles(
        id,
        company_name,
        contact_person,
        contact_email
      )
    `,
    )
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false });

  // Get client company profiles for the form
  const { data: clientCompanyProfiles } = await supabase
    .from("client_company_profiles")
    .select("id, company_name, contact_person, contact_email")
    .order("company_name");

  const equipmentStats = {
    total: equipment?.length || 0,
    active: equipment?.filter((e) => e.status === "active").length || 0,
    inactive: equipment?.filter((e) => e.status === "inactive").length || 0,
    maintenance:
      equipment?.filter((e) => e.status === "maintenance").length || 0,
  };

  const decryptedEquipment = equipment?.map((e) => ({
    ...e,
    login_password: e.login_password ? decrypt(e.login_password) : null,
  }));

  return (
    <>
      <DashboardNavbar />
      <Toaster />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Monitor className="h-8 w-8" />
                  Equipment Inventory
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage client IT equipment and device inventory
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/equipment/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{equipmentStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {equipmentStats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {equipmentStats.inactive}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {equipmentStats.maintenance}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>
                Manage and track all client IT equipment and devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentTable
                equipment={decryptedEquipment || []}
                clientCompanyProfiles={clientCompanyProfiles || []}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
