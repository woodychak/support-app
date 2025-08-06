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
    session?: string;
    export_results?: string;
    filter_text?: string;
    record_count?: string;
    filter?: string;
  }>;
}

export default async function ClientOnsiteSupportPage({
  searchParams,
}: ClientOnsiteSupportPageProps) {
  const params = await searchParams;
  const clientId = params.client_id;
  const sessionToken = params.session;
  const currentFilter = params.filter || "this_month";

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

  // Build query with date filtering based on current filter
  let query = supabase
    .from("onsite_support")
    .select("*")

    .eq("company_id", clientData.company_id)
    .eq("client_company_profile_id", clientData.client_company_profile_id)
    .order("work_date", { ascending: false });

  // Apply date filters
  const currentDate = new Date();
  if (currentFilter === "this_month") {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );
    query = query
      .gte("work_date", startOfMonth.toISOString().split("T")[0])
      .lte("work_date", endOfMonth.toISOString().split("T")[0]);
  } else if (currentFilter === "last_month") {
    const startOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
    );
    query = query
      .gte("work_date", startOfLastMonth.toISOString().split("T")[0])
      .lte("work_date", endOfLastMonth.toISOString().split("T")[0]);
  }
  // For "all", no additional filters are applied

  const { data: onsiteRecords } = await query;

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/client-portal/dashboard?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}`}
                >
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
                          const hours = parseFloat(record.totalHours || "0");
                          return total + (isNaN(hours) ? 0 : hours);
                        }, 0)
                        .toFixed(1) || "0.0"}
                      h{" "}
                      {currentFilter === "this_month"
                        ? "this month"
                        : currentFilter === "last_month"
                          ? "last month"
                          : "total"}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>
                    {recordsWithHours?.length || 0} onsite support records •{" "}
                    {currentFilter === "this_month" &&
                      new Date().toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    {currentFilter === "last_month" &&
                      new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() - 1,
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    {currentFilter === "all" && "All time"}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/client-portal/onsite-support?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}&filter=all`}
                    >
                      <Button
                        variant={
                          currentFilter === "all" ? "default" : "outline"
                        }
                        size="sm"
                      >
                        All
                      </Button>
                    </Link>
                    <Link
                      href={`/client-portal/onsite-support?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}&filter=last_month`}
                    >
                      <Button
                        variant={
                          currentFilter === "last_month" ? "default" : "outline"
                        }
                        size="sm"
                      >
                        Last Month
                      </Button>
                    </Link>
                    <Link
                      href={`/client-portal/onsite-support?client_id=${clientId}&session=${encodeURIComponent(sessionToken)}&filter=this_month`}
                    >
                      <Button
                        variant={
                          currentFilter === "this_month" ? "default" : "outline"
                        }
                        size="sm"
                      >
                        This Month
                      </Button>
                    </Link>
                  </div>
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
                    <ClientOnsiteSupportTable
                      records={recordsWithHours || []}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Section */}
            <ClientOnsiteSupportExport
              clientId={clientId}
              sessionToken={sessionToken ?? ""}
            />

            {/* Export Results */}
            <ClientExportResults
              exportResults={exportResults}
              filterText={filterText}
              recordCount={recordCount}
            />
          </div>
        </main>
      </div>
    </>
  );
}
