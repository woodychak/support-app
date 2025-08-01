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
import { Monitor, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClientEquipmentTable } from "@/components/client-equipment-table";
import { ClientEquipmentExport } from "@/components/client-equipment-export";
import { ClientEquipmentExportResults } from "@/components/client-equipment-export-results";
import { Toaster } from "@/components/ui/toaster";

interface ClientEquipmentProps {
  searchParams: Promise<{
    client_id?: string;
    role?: string;
    export_results?: string;
    filter_text?: string;
    record_count?: string;
  }>;
}

export default async function ClientEquipmentPage({
  searchParams,
}: ClientEquipmentProps) {
  const params = await searchParams;
  const clientId = params.client_id;
  const userRole = params.role || "user";

  if (!clientId) {
    return redirect("/client-portal");
  }

  // Check if user has admin role to access equipment page
  if (userRole !== "admin") {
    return redirect(
      `/client-portal/dashboard?client_id=${clientId}&role=${userRole}`,
    );
  }

  const supabase = await createClient();

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

  // Get client's equipment
  const { data: equipment } = await supabase
    .from("equipment_inventory")
    .select("*")
    .eq("client_credential_id", clientId)
    .order("created_at", { ascending: false });

  const equipmentStats = {
    total: equipment?.length || 0,
    active: equipment?.filter((e) => e.status === "active").length || 0,
    inactive: equipment?.filter((e) => e.status === "inactive").length || 0,
    maintenance:
      equipment?.filter((e) => e.status === "maintenance").length || 0,
  };

  // Handle export results
  let exportResults = null;
  let filterText = "";
  let recordCount = 0;

  if (params.export_results) {
    try {
      exportResults = JSON.parse(decodeURIComponent(params.export_results));
      filterText = decodeURIComponent(params.filter_text || "");
      recordCount = parseInt(params.record_count || "0");
    } catch (e) {
      console.error("Error parsing export results:", e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/client-portal/dashboard?client_id=${clientId}&role=${userRole}`}
              >
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Monitor className="h-6 w-6" />
                  Equipment Inventory
                </h1>
                <p className="text-gray-600">
                  {clientData.companies?.name} - Your IT Equipment
                </p>
              </div>
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
                      Total Equipment
                    </p>
                    <p className="text-2xl font-bold">{equipmentStats.total}</p>
                  </div>
                  <Monitor className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {equipmentStats.active}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Inactive
                    </p>
                    <p className="text-2xl font-bold text-gray-600">
                      {equipmentStats.inactive}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Maintenance
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {equipmentStats.maintenance}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Section */}
          <ClientEquipmentExport clientId={clientId} />

          {/* Export Results */}
          {exportResults && (
            <ClientEquipmentExportResults
              exportResults={exportResults}
              filterText={filterText}
              recordCount={recordCount}
            />
          )}

          {/* Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Equipment</CardTitle>
              <CardDescription>
                View your IT equipment and device inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!equipment || equipment.length === 0 ? (
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No equipment found
                  </h3>
                  <p className="text-gray-600">
                    No equipment has been assigned to your account yet.
                  </p>
                </div>
              ) : (
                <ClientEquipmentTable equipment={equipment} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
