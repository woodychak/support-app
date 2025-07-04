import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
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
import { UserCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateUserProfileAction } from "../actions";
import { FormMessage, Message } from "@/components/form-message";

interface ProfilePageProps {
  searchParams: Promise<Message>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateUserProfileAction} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      defaultValue={userData?.full_name || ""}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      defaultValue={userData?.name || ""}
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email || ""}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>User ID:</strong> {user.id}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Last Sign In:</strong>{" "}
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </p>
                    <p>
                      <strong>User Type:</strong>{" "}
                      {userData?.user_type || "User"}
                    </p>
                  </div>
                </div>

                <FormMessage message={params} />

                <div className="flex gap-4">
                  <Button type="submit">Update Profile</Button>
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
