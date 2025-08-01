import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import {
  createClientCredentialAction,
  updateClientCredentialAction,
  deleteClientCredentialAction,
} from "@/app/actions";
import {
  createClientCompanyProfileAction,
  updateClientCompanyProfileAction,
  deleteClientCompanyProfileAction,
} from "@/app/actions-client-company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import {
  Users,
  Plus,
  User,
  Mail,
  Calendar,
  Pencil,
  Trash2,
  Building,
  Phone,
  MapPin,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

  // Get existing client credentials with company profiles
  const { data: clientCredentials } = await supabase
    .from("client_credentials")
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

  // Get client company profiles for the dropdown
  const { data: clientCompanyProfiles } = await supabase
    .from("client_company_profiles")
    .select("*")
    .order("company_name", { ascending: true });

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
              First create client company profiles, then create login
              credentials for your support portal.
            </p>
          </header>

          {/* Step 1: Create Client Company Profile */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Step 1: Create Client Company Profile
              </CardTitle>
              <CardDescription>
                First, create a company profile for your client organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      placeholder="Client Company Ltd."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      type="text"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      placeholder="contact@clientcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Business St, City, State 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the client company..."
                    rows={3}
                  />
                </div>

                <SubmitButton
                  formAction={createClientCompanyProfileAction}
                  pendingText="Creating..."
                >
                  Create Client Company Profile
                </SubmitButton>

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {/* Step 2: Create Client Login Credentials */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Step 2: Create Client Login Credentials
              </CardTitle>
              <CardDescription>
                After creating a company profile, generate login credentials for
                clients to access their support portal.
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_company_profile_id">
                      Client Company *
                    </Label>
                    <Select name="client_company_profile_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client company" />
                      </SelectTrigger>
                      <SelectContent>
                        {!clientCompanyProfiles ||
                        clientCompanyProfiles.length === 0 ? (
                          <SelectItem value="no-companies" disabled>
                            No companies available - Create one first
                          </SelectItem>
                        ) : (
                          clientCompanyProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.company_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SubmitButton
                  formAction={createClientCredentialAction}
                  pendingText="Creating..."
                  disabled={
                    !clientCompanyProfiles || clientCompanyProfiles.length === 0
                  }
                >
                  Create Client Credential
                </SubmitButton>

                {(!clientCompanyProfiles ||
                  clientCompanyProfiles.length === 0) && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    ⚠️ You must create at least one client company profile
                    before creating login credentials.
                  </p>
                )}

                <FormMessage message={message} />
              </form>
            </CardContent>
          </Card>

          {/* Existing Client Company Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Client Company Profiles</CardTitle>
              <CardDescription>
                {clientCompanyProfiles?.length || 0} client company profiles
                created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!clientCompanyProfiles || clientCompanyProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No client company profiles created yet.</p>
                  <p className="text-sm">
                    Create your first client company profile above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientCompanyProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">
                              {profile.company_name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {profile.contact_person && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {profile.contact_person}
                                </span>
                              )}
                              {profile.contact_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {profile.contact_email}
                                </span>
                              )}
                              {profile.contact_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {profile.contact_phone}
                                </span>
                              )}
                            </div>
                            {profile.address && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {profile.address}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Edit Client Company Profile
                                </DialogTitle>
                                <DialogDescription>
                                  Update client company information
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                action={updateClientCompanyProfileAction}
                                className="space-y-4"
                              >
                                <input
                                  type="hidden"
                                  name="profile_id"
                                  value={profile.id}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="company_name">
                                      Company Name *
                                    </Label>
                                    <Input
                                      id="company_name"
                                      name="company_name"
                                      defaultValue={profile.company_name}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="contact_person">
                                      Contact Person
                                    </Label>
                                    <Input
                                      id="contact_person"
                                      name="contact_person"
                                      defaultValue={
                                        profile.contact_person || ""
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="contact_email">
                                      Contact Email
                                    </Label>
                                    <Input
                                      id="contact_email"
                                      name="contact_email"
                                      type="email"
                                      defaultValue={profile.contact_email || ""}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="contact_phone">
                                      Contact Phone
                                    </Label>
                                    <Input
                                      id="contact_phone"
                                      name="contact_phone"
                                      defaultValue={profile.contact_phone || ""}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="address">Address</Label>
                                  <Input
                                    id="address"
                                    name="address"
                                    defaultValue={profile.address || ""}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="description">
                                    Description
                                  </Label>
                                  <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={profile.description || ""}
                                    rows={3}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                                <FormMessage message={message} />
                              </form>
                            </DialogContent>
                          </Dialog>

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
                                  Delete Client Company Profile
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this client
                                  company profile? This action cannot be undone
                                  and will affect any associated client
                                  credentials.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={deleteClientCompanyProfileAction}>
                                  <input
                                    type="hidden"
                                    name="profile_id"
                                    value={profile.id}
                                  />
                                  <Button variant="destructive" type="submit">
                                    Delete
                                  </Button>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Client Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Client Login Credentials</CardTitle>
              <CardDescription>
                {clientCredentials?.length || 0} client login credentials
                created
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
                            <div className="flex items-center gap-4 text-sm mt-1">
                              <Badge variant="outline">
                                Role: {client.role || "user"}
                              </Badge>
                              {client.client_company_profiles && (
                                <Badge variant="secondary">
                                  Company:{" "}
                                  {client.client_company_profiles.company_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={client.is_active ? "default" : "secondary"}
                          >
                            {client.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Edit Client Credential
                                </DialogTitle>
                                <DialogDescription>
                                  Update client information and access settings
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                action={updateClientCredentialAction}
                                className="space-y-4"
                              >
                                <input
                                  type="hidden"
                                  name="client_id"
                                  value={client.id}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                      id="username"
                                      name="username"
                                      defaultValue={client.username}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="password">
                                      New Password
                                    </Label>
                                    <Input
                                      id="password"
                                      name="password"
                                      type="password"
                                      placeholder="Leave blank to keep current"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                      id="full_name"
                                      name="full_name"
                                      defaultValue={client.full_name || ""}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                      id="email"
                                      name="email"
                                      type="email"
                                      defaultValue={client.email || ""}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select
                                      name="role"
                                      defaultValue={client.role || "user"}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">
                                          Admin
                                        </SelectItem>
                                        <SelectItem value="user">
                                          User
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="client_company_profile_id">
                                      Client Company
                                    </Label>
                                    <Select
                                      name="client_company_profile_id"
                                      defaultValue={
                                        client.client_company_profile_id ||
                                        "none"
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          No company assigned
                                        </SelectItem>
                                        {clientCompanyProfiles?.map(
                                          (profile) => (
                                            <SelectItem
                                              key={profile.id}
                                              value={profile.id}
                                            >
                                              {profile.company_name}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="is_active"
                                    name="is_active"
                                    defaultChecked={client.is_active}
                                  />
                                  <Label htmlFor="is_active">
                                    Active account
                                  </Label>
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                                <FormMessage message={message} />
                              </form>
                            </DialogContent>
                          </Dialog>

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
                                  Delete Client Credential
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this client
                                  credential? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={deleteClientCredentialAction}>
                                  <input
                                    type="hidden"
                                    name="client_id"
                                    value={client.id}
                                  />
                                  <Button variant="destructive" type="submit">
                                    Delete
                                  </Button>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
