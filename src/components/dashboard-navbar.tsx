"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Building2,
  Users,
  Ticket,
  Home,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" prefetch className="text-xl font-bold">
            ASSA
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/company"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Building2 className="h-4 w-4" />
              Company
            </Link>
            <Link
              href="/dashboard/clients"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Clients
            </Link>
            <Link
              href="/dashboard/tickets"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Ticket className="h-4 w-4" />
              Tickets
            </Link>
            <Link
              href="/dashboard/onsite-support"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Wrench className="h-4 w-4" />
              Onsite Support
            </Link>
            <Link
              href="/dashboard/staff"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <UserCircle className="h-4 w-4" />
              Staff
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/company">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/clients">
                  <Users className="h-4 w-4 mr-2" />
                  Clients
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/tickets">
                  <Ticket className="h-4 w-4 mr-2" />
                  Tickets
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/onsite-support">
                  <Wrench className="h-4 w-4 mr-2" />
                  Onsite Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/staff">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Staff
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
