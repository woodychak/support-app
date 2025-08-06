import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import {
  addOnsiteSupportAction,
  deleteOnsiteSupportAction,
  updateOnsiteSupportAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  User,
  Trash2,
  FileText,
  Wrench,
  Edit,
  Timer,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  OnsiteSupportExport,
  ExportResults,
} from "@/components/onsite-support-export";
import Link from "next/link";

interface OnsiteSupportPageProps {
  searchParams: Promise<
    Message & {
      export_results?: string;
      filter_text?: string;
      record_count?: string;
      filter?: string;
    }
  >;
}

export default async function OnsiteSupportPage({
  searchParams,
}: OnsiteSupportPageProps) {
  const supabase = await createClient();
  const message = await searchParams;
  const currentFilter = message.filter || "this_month";

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

  // Build query with date filtering based on current filter
  let query = supabase
    .from("onsite_support")
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

  // Get client company profiles for dropdown
  const { data: clientCompanyProfiles } = await supabase
    .from("client_company_profiles")
    .select("id, company_name, contact_person, contact_email")
    .order("company_name", { ascending: true });

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

  // Get current date for default value
  const today = new Date().toISOString().split("T")[0];

  // Calculate total hours for the filtered period
  const filteredHours =
    recordsWithHours?.reduce((total, record) => {
      const hours = parseFloat(record.totalHours || "0");
      return total + (isNaN(hours) ? 0 : hours);
    }, 0) || 0;

  // Parse export results if available
  const exportResults = message.export_results
    ? JSON.parse(decodeURIComponent(message.export_results))
    : null;
  const filterText = message.filter_text
    ? decodeURIComponent(message.filter_text)
    : "";
  const recordCount = message.record_count ? parseInt(message.record_count) : 0;

  // Calculate total hours for export results
  const exportResultsWithHours = exportResults?.map((record: any) => {
    let totalHours = null;
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`2000-01-01T${record.check_in_time}`);
      const checkOut = new Date(`2000-01-01T${record.check_out_time}`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    }
    return { ...record, totalHours };
  });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wrench className="h-8 w-8" />
              Onsite Support Management
            </h1>
            <span className="text-muted-foreground">
              Track engineer onsite support activities and generate reports.
            </span>
          </header>

          {/* Add New Record */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Onsite Support Record
              </CardTitle>
              <CardDescription>
                Record engineer onsite support details including time tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engineer_name">Engineer Name *</Label>
                    <Input
                      id="engineer_name"
                      name="engineer_name"
                      type="text"
                      placeholder="Engineer's full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_date">Work Date *</Label>
                    <Input
                      id="work_date"
                      name="work_date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_in_time">Check-in Time</Label>
                    <Input
                      id="check_in_time"
                      name="check_in_time"
                      type="time"
                      placeholder="09:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out_time">Check-out Time</Label>
                    <Input
                      id="check_out_time"
                      name="check_out_time"
                      type="time"
                      placeholder="17:00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_company_profile_id">
                    Client Company (required)
                  </Label>
                  <Select name="client_company_profile_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client company" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientCompanyProfiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.company_name}
                          {profile.contact_person && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({profile.contact_person})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_details">Job Details</Label>
                  <Textarea
                    id="job_details"
                    name="job_details"
                    placeholder="Describe the work performed, issues resolved, etc..."
                    rows={4}
                  />
                </div>

                <SubmitButton
                  formAction={addOnsiteSupportAction}
                  pendingText="Adding..."
                >
                  Add Support Record
                </SubmitButton>

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {/* Existing Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Onsite Support Records</span>
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {filteredHours.toFixed(1)}h{" "}
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
                  {recordsWithHours?.length || 0} support records on file •{" "}
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
                  <Link href="/dashboard/onsite-support?filter=all">
                    <Button
                      variant={currentFilter === "all" ? "default" : "outline"}
                      size="sm"
                    >
                      All
                    </Button>
                  </Link>
                  <Link href="/dashboard/onsite-support?filter=last_month">
                    <Button
                      variant={
                        currentFilter === "last_month" ? "default" : "outline"
                      }
                      size="sm"
                    >
                      Last Month
                    </Button>
                  </Link>
                  <Link href="/dashboard/onsite-support?filter=this_month">
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
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <span>No onsite support records yet.</span>
                  <span className="text-sm">
                    Add your first support record above.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Engineer</th>
                        <th className="text-left p-3 font-medium">Client</th>
                        <th className="text-left p-3 font-medium">Check In</th>
                        <th className="text-left p-3 font-medium">Check Out</th>
                        <th className="text-left p-3 font-medium">
                          Total Hours
                        </th>
                        <th className="text-left p-3 font-medium">
                          Job Details
                        </th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsWithHours.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(record.work_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {record.engineer_name}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {record.client_company_profiles ? (
                                <span>
                                  {record.client_company_profiles.company_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {record.check_in_time ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-green-600" />
                                <span>{record.check_in_time}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {record.check_out_time ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-red-600" />
                                <span>{record.check_out_time}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {record.totalHours ? (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Clock className="h-3 w-3 text-blue-600" />
                                <span>{record.totalHours}h</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs">
                            {record.job_details ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="text-sm text-muted-foreground underline hover:text-primary truncate w-full text-left"
                                    title="Click to view full job details"
                                  >
                                    {record.job_details.slice(0, 30)}...
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                  <DialogHeader>
                                    <DialogTitle>Job Details</DialogTitle>
                                    <DialogDescription>
                                      Full job description for{" "}
                                      {record.engineer_name} on{" "}
                                      {new Date(
                                        record.work_date,
                                      ).toLocaleDateString()}
                                      .
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="whitespace-pre-line text-sm text-gray-700">
                                    {record.job_details}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {/* Edit Dialog */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Edit Support Record
                                    </DialogTitle>
                                    <DialogDescription>
                                      Update the onsite support record details.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form className="space-y-4">
                                    <input
                                      type="hidden"
                                      name="record_id"
                                      value={record.id}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`engineer_name_${record.id}`}
                                        >
                                          Engineer Name *
                                        </Label>
                                        <Input
                                          id={`engineer_name_${record.id}`}
                                          name="engineer_name"
                                          type="text"
                                          defaultValue={record.engineer_name}
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`work_date_${record.id}`}
                                        >
                                          Work Date *
                                        </Label>
                                        <Input
                                          id={`work_date_${record.id}`}
                                          name="work_date"
                                          type="date"
                                          defaultValue={record.work_date}
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`check_in_time_${record.id}`}
                                        >
                                          Check-in Time
                                        </Label>
                                        <Input
                                          id={`check_in_time_${record.id}`}
                                          name="check_in_time"
                                          type="time"
                                          defaultValue={
                                            record.check_in_time || ""
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`check_out_time_${record.id}`}
                                        >
                                          Check-out Time
                                        </Label>
                                        <Input
                                          id={`check_out_time_${record.id}`}
                                          name="check_out_time"
                                          type="time"
                                          defaultValue={
                                            record.check_out_time || ""
                                          }
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`client_company_profile_id_${record.id}`}
                                      >
                                        Client Company (Optional)
                                      </Label>
                                      <Select
                                        name="client_company_profile_id"
                                        defaultValue={
                                          record.client_company_profile_id ||
                                          "none"
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a client company (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            No specific client company
                                          </SelectItem>
                                          {clientCompanyProfiles?.map(
                                            (profile) => (
                                              <SelectItem
                                                key={profile.id}
                                                value={profile.id}
                                              >
                                                {profile.company_name}
                                                {profile.contact_person && (
                                                  <span className="text-xs text-gray-500 ml-2">
                                                    ({profile.contact_person})
                                                  </span>
                                                )}
                                              </SelectItem>
                                            ),
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`job_details_${record.id}`}
                                      >
                                        Job Details
                                      </Label>
                                      <Textarea
                                        id={`job_details_${record.id}`}
                                        name="job_details"
                                        defaultValue={record.job_details || ""}
                                        rows={4}
                                      />
                                    </div>

                                    <DialogFooter>
                                      <SubmitButton
                                        formAction={updateOnsiteSupportAction}
                                        pendingText="Updating..."
                                      >
                                        Update Record
                                      </SubmitButton>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              {/* Delete Dialog */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Support Record
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      onsite support record for{" "}
                                      {record.engineer_name}? This action cannot
                                      be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <form action={deleteOnsiteSupportAction}>
                                      <input
                                        type="hidden"
                                        name="record_id"
                                        value={record.id}
                                      />
                                      <AlertDialogAction asChild>
                                        <Button
                                          variant="destructive"
                                          type="submit"
                                        >
                                          Delete
                                        </Button>
                                      </AlertDialogAction>
                                    </form>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <OnsiteSupportExport />

          {/* Export Results */}
          <ExportResults
            exportResults={exportResults}
            filterText={filterText}
            recordCount={recordCount}
          />
        </div>
      </main>
    </>
  );
}
