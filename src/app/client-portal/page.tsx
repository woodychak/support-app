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
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Prevent URL copying and maintain session security
            (function() {
              // Disable right-click context menu
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
              });
              
              // Disable text selection
              document.addEventListener('selectstart', function(e) {
                e.preventDefault();
              });
              
              // Disable keyboard shortcuts for copying URL and dev tools
              document.addEventListener('keydown', function(e) {
                // Prevent Ctrl+L (address bar focus)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+U (view source)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
                  e.preventDefault();
                }
                // Prevent F12 (dev tools)
                if (e.key === 'F12') {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+I (dev tools)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+J (console)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                  e.preventDefault();
                }
                // Prevent Ctrl+Shift+C (element inspector)
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                  e.preventDefault();
                }
              });
              
              // Clear URL from browser history on page load
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, '/client-portal');
              }
              
              // Prevent drag and drop
              document.addEventListener('dragstart', function(e) {
                e.preventDefault();
              });
              
              // Disable print screen (limited effectiveness)
              document.addEventListener('keyup', function(e) {
                if (e.key === 'PrintScreen') {
                  navigator.clipboard.writeText('');
                }
              });
              
              // Monitor for URL changes and clear sensitive data
              let currentUrl = window.location.href;
              setInterval(function() {
                if (window.location.href !== currentUrl) {
                  currentUrl = window.location.href;
                  // Clear any sensitive data from URL if it contains session info
                  if (window.location.search.includes('session=') || window.location.search.includes('client_id=')) {
                    if (window.history && window.history.replaceState) {
                      window.history.replaceState({}, document.title, '/client-portal');
                    }
                  }
                }
              }, 1000);
            })();
          `,
        }}
      />
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
