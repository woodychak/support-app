"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { TicketFilters } from "@/components/ticket-filters";

interface Client {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
}

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  client_credentials?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

interface TicketDashboardClientProps {
  tickets: TicketData[];
  clients: Client[];
}

export function TicketDashboardClient({
  tickets,
  clients,
}: TicketDashboardClientProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-100 text-orange-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const [filters, setFilters] = useState({
    status: "all",
    client: "all",
    priority: "all",
    search: "",
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (filters.status !== "all" && ticket.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "all" && ticket.priority !== filters.priority) {
        return false;
      }

      // Client filter
      if (
        filters.client !== "all" &&
        ticket.client_credentials?.id !== filters.client
      ) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const titleMatch = ticket.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = ticket.description
          .toLowerCase()
          .includes(searchTerm);
        const clientMatch =
          ticket.client_credentials?.full_name
            ?.toLowerCase()
            .includes(searchTerm) ||
          ticket.client_credentials?.username
            ?.toLowerCase()
            .includes(searchTerm) ||
          ticket.client_credentials?.email?.toLowerCase().includes(searchTerm);

        if (!titleMatch && !descriptionMatch && !clientMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  const filteredStats = useMemo(() => {
    return {
      total: filteredTickets.length,
      open: filteredTickets.filter((t) => t.status === "open").length,
      inProgress: filteredTickets.filter((t) => t.status === "in_progress")
        .length,
      resolved: filteredTickets.filter((t) => t.status === "resolved").length,
    };
  }, [filteredTickets]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TicketFilters clients={clients} onFiltersChange={setFilters} />

      {/* Filtered Stats */}
      {(filters.status !== "all" ||
        filters.client !== "all" ||
        filters.priority !== "all" ||
        filters.search) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                <strong>Filtered Results:</strong> Showing {filteredStats.total}{" "}
                of {tickets.length} tickets
              </div>
              <div className="flex gap-4 text-xs text-blue-700">
                <span>Open: {filteredStats.open}</span>
                <span>In Progress: {filteredStats.inProgress}</span>
                <span>Resolved: {filteredStats.resolved}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            {filteredTickets.length === tickets.length
              ? "View and manage all client-submitted support tickets"
              : `Showing ${filteredTickets.length} filtered tickets out of ${tickets.length} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tickets.length === 0
                  ? "No tickets yet"
                  : "No tickets match your filters"}
              </h3>
              <p className="text-gray-600">
                {tickets.length === 0
                  ? "When clients submit support tickets, they will appear here."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(ticket.priority)}
                      >
                        {ticket.priority} priority
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {ticket.client_credentials?.full_name ||
                            ticket.client_credentials?.username ||
                            "Unknown Client"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
