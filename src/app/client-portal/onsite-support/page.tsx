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
import {
  Wrench,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  ClientOnsiteSupportExport,
  ClientExportResults,
} from "@/components/client-onsite-support-export";
import ClientOnsiteSupportTable from "@/components/ClientOnsiteSupportTable";

interface ClientOnsiteSupportPageProps {
  searchParams: Promise<{
    client_id?: string;
    export_results?: string;
    filter_text?: string;
    record_count?: string;
  }>;
}

export default async function ClientOnsiteSupportPage({
  searchParams,
}: ClientOnsiteSupportPageProps) {
  const params = await searchParams;
  const clientId = params.client_id;

  if (!clientId) {
    return redirect("/client-portal");
  }

  const supabase = await createClient();

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

  // Get client's onsite support records
  const { data: onsiteRecords } = await supabase
    .from("onsite_support")
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
    .eq("company_id", clientData.company_id)
    .eq("client_credential_id", clientId)
    .order("work_date", { ascending: false });

  // Calculate total hours for each record
  const recordsWithHours = onsiteRecords?.map((record) => {
    let totalHours = null;
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`2000-01-01T${record.check_in_time}`);
      const checkOut = new Date(`2000-01-01T${record.check_out_time}`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    }
    return { ...record, totalHours };
  });

  // Parse export results if available
  const exportResults = params.export_results
    ? JSON.parse(decodeURIComponent(params.export_results))
    : null;
  const filterText = params.filter_text
    ? decodeURIComponent(params.filter_text)
    : "";
  const recordCount = params.record_count ? parseInt(params.record_count) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/client-portal/dashboard?client_id=${clientId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="h-6 w-6" />
                  Onsite Support Reports
                </h1>
                <p className="text-gray-600">
                  {clientData.companies?.name} - Your onsite support records
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Recent Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Onsite Support Records</span>
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {recordsWithHours
                      ?.reduce((total, record) => {
                        const recordDate = new Date(record.work_date);
                        const currentDate = new Date();
                        if (
                          recordDate.getMonth() === currentDate.getMonth() &&
                          recordDate.getFullYear() === currentDate.getFullYear()
                        ) {
                          const hours = parseFloat(record.totalHours || "0");
                          return total + (isNaN(hours) ? 0 : hours);
                        }
                        return total;
                      }, 0)
                      .toFixed(1) || "0.0"}
                    h this month
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                {recordsWithHours?.length || 0} onsite support records on file •{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                total hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!recordsWithHours || recordsWithHours.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No onsite support records yet
                  </h3>
                  <p className="text-gray-600">
                    Your onsite support records will appear here once they are
                    created by our team.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  
                    
                    <ClientOnsiteSupportTable records={recordsWithHours || []} />
                    
                  
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <ClientOnsiteSupportExport clientId={clientId} />

          {/* Export Results */}
          <ClientExportResults
            exportResults={exportResults}
            filterText={filterText}
            recordCount={recordCount}
          />
        </div>
      </main>
    </div>
  );
}
