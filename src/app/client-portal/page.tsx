import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientSignInAction } from "@/app/actions";
import { Users, Shield } from "lucide-react";
import Link from "next/link";

interface ClientPortalProps {
  searchParams: Promise<Message>;
}

export default async function ClientPortal({
  searchParams,
}: ClientPortalProps) {
  const message = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600 mt-2">
            Access your support tickets and submit new requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Sign In
            </CardTitle>
            <CardDescription>
              Enter your client credentials to access your support portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Your username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Your password"
                  required
                />
              </div>

              <SubmitButton
                formAction={clientSignInAction}
                pendingText="Signing in..."
                className="w-full"
              >
                Sign In
              </SubmitButton>

              <FormMessage message={message} />
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Need help? Contact your support team or{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              visit our main site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
