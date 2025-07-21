import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createStaffAccountAction,
  deleteStaffAccountAction,
  updateStaffAccountAction,
  confirmStaffAccountAction,
} from "@/app/actions";
import { DeleteStaffForm } from "@/components/delete-staff-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserCircle,
  Plus,
  Mail,
  User,
  Trash2,
  Edit,
  Shield,
  Users,
  CheckCircle,
  Activity,
  Clock,
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
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";

interface StaffPageProps {
  searchParams: Promise<Message>;
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const supabase = await createClient();
  const message = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  const currentUserId = user?.id ?? "";

  // Get user data with company info
  const { data: userData } = await supabase
    .from("users")
    .select("company_id, user_type")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return redirect("/dashboard/company");
  }

  // Check if user is admin
  if (userData.user_type !== "admin") {
    return redirect("/dashboard");
  }

  // Get existing staff members with confirmation status
  const { data: staffMembers, error: staffError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("company_id", userData.company_id)
    .in("user_type", ["admin", "staff"])
    .order("created_at", { ascending: false });

  // Calculate statistics
  const totalStaff = staffMembers?.length || 0;
  const adminCount =
    staffMembers?.filter((s) => s.user_type === "admin").length || 0;
  const staffCount =
    staffMembers?.filter((s) => s.user_type === "staff").length || 0;
  const confirmedCount =
    staffMembers?.filter((s) => s.email_confirmed).length || 0;
  const pendingCount = totalStaff - confirmedCount;

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Staff Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage staff accounts for handling support tickets and
              onsite records.
            </p>
          </header>

          {/* Staff Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Staff"
              value={totalStaff}
              description="All staff members"
              icon={Users}
            />
            <StatsCard
              title="Administrators"
              value={adminCount}
              description="Admin accounts"
              icon={Shield}
            />
            <StatsCard
              title="Staff Members"
              value={staffCount}
              description="Regular staff accounts"
              icon={User}
            />
            <StatsCard
              title="Confirmed Accounts"
              value={confirmedCount}
              description="Email confirmed accounts"
              icon={CheckCircle}
            />
          </div>

          {/* Add New Staff Member */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Staff Member
              </CardTitle>
              <CardDescription>
                Create a new staff account with appropriate permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="staff@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter a secure password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_type">User Type *</Label>
                  <Select name="user_type" defaultValue="staff">
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Staff can handle tickets and onsite records. Administrators
                    can also manage staff accounts.
                  </p>
                </div>

                <SubmitButton
                  formAction={createStaffAccountAction}
                  pendingText="Creating..."
                >
                  Create Staff Account
                </SubmitButton>

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {/* Existing Staff Members */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>
                {staffMembers?.length || 0} staff members in your company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!staffMembers || staffMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff members yet.</p>
                  <p className="text-sm">Add your first staff member above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staffMembers.map((staff) => {
                    const isConfirmed = staff.email_confirmed || false;

                    return (
                      <div
                        key={staff.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-medium text-lg">
                                {staff.full_name}
                              </h3>
                              <Badge
                                variant={
                                  staff.user_type === "admin"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {staff.user_type === "admin" ? (
                                  <>
                                    <Shield className="h-3 w-3 mr-1" />
                                    Administrator
                                  </>
                                ) : (
                                  <>
                                    <User className="h-3 w-3 mr-1" />
                                    Staff
                                  </>
                                )}
                              </Badge>
                              <Badge
                                variant={isConfirmed ? "default" : "secondary"}
                              >
                                {isConfirmed ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Confirmed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <Mail className="h-3 w-3" />
                              <span>{staff.email}</span>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Created:{" "}
                              {new Date(staff.created_at).toLocaleDateString(
                                "en-US",
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {/* Confirm Button - Only show for unconfirmed accounts */}
                            {!isConfirmed && (
                              <form action={confirmStaffAccountAction}>
                                <input
                                  type="hidden"
                                  name="staff_id"
                                  value={staff.id}
                                />
                                <input
                                  type="hidden"
                                  name="current_user_id"
                                  value={currentUserId}
                                />

                                <Button
                                  variant="default"
                                  size="sm"
                                  type="submit"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirm
                                </Button>
                              </form>
                            )}

                            {/* Edit Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit Staff Member</DialogTitle>
                                  <DialogDescription>
                                    Update the staff member's information.
                                  </DialogDescription>
                                </DialogHeader>
                                <form className="space-y-4">
                                  <input
                                    type="hidden"
                                    name="staff_id"
                                    value={staff.id}
                                  />
                                  <div className="space-y-2">
                                    <Label htmlFor={`full_name_${staff.id}`}>
                                      Full Name *
                                    </Label>
                                    <Input
                                      id={`full_name_${staff.id}`}
                                      name="full_name"
                                      type="text"
                                      defaultValue={staff.full_name || ""}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`email_${staff.id}`}>
                                      Email Address *
                                    </Label>
                                    <Input
                                      id={`email_${staff.id}`}
                                      name="email"
                                      type="email"
                                      defaultValue={staff.email || ""}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`user_type_${staff.id}`}>
                                      User Type *
                                    </Label>
                                    <Select
                                      name="user_type"
                                      defaultValue={staff.user_type || "staff"}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select user type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="staff">
                                          Staff
                                        </SelectItem>
                                        <SelectItem value="admin">
                                          Administrator
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <DialogFooter>
                                    <SubmitButton
                                      formAction={updateStaffAccountAction}
                                      pendingText="Updating..."
                                    >
                                      Update Staff Member
                                    </SubmitButton>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Dialog - Don't allow deleting self */}
                            {staff.id !== user.id && (
                              <>
                                {/* ✅ 這是在外層的真正 <form>，不能放在 Dialog 裡 */}
                                <form
                                  id={`delete-staff-${staff.id}`}
                                  action={deleteStaffAccountAction}
                                >
                                  <input
                                    type="hidden"
                                    name="staff_id"
                                    value={staff.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="current_user_id"
                                    value={currentUserId}
                                  />
                                </form>

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
                                        Delete Staff Member
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete{" "}
                                        {staff.full_name}? This will permanently
                                        remove their account and they will no
                                        longer be able to access the system.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>

                                      {/* ✅ 用 form 屬性來觸發外部 form 提交 */}
                                      <AlertDialogAction asChild>
                                        <Button
                                          variant="destructive"
                                          type="submit"
                                          form={`delete-staff-${staff.id}`}
                                        >
                                          Delete
                                        </Button>
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
