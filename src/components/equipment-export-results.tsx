"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download } from "lucide-react";

interface EquipmentExportResultsProps {
  exportResults: any[];
  filterText: string;
  recordCount: number;
  includeCredentials: boolean;
}

export function EquipmentExportResults({
  exportResults,
  filterText,
  recordCount,
  includeCredentials,
}: EquipmentExportResultsProps) {
  const handleDownloadExcel = () => {
    if (typeof window !== "undefined" && exportResults) {
      import("xlsx").then((XLSX) => {
        const headers = [
          "Device Name",
          "Device Type",
          "Client",
          "IP Address/URL",
          "Status",
          "Location",
          "Description",
        ];

        if (includeCredentials) {
          headers.push("Login Username", "Login Password");
        }

        const ws_data = [headers];

        exportResults.forEach((record: any) => {
          const row = [
            record.device_name,
            record.device_type || "",
            record.client_credentials
              ? record.client_credentials.full_name ||
                record.client_credentials.username
              : "Unassigned",
            record.device_ip_address || record.device_url || "",
            record.status,
            record.location || "",
            record.description || "",
          ];

          if (includeCredentials) {
            row.push(record.login_username || "", record.login_password || "");
          }

          ws_data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment Inventory");
        XLSX.writeFile(
          wb,
          `equipment-inventory${filterText.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`,
        );
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Export Results{filterText}</span>
          <Button onClick={handleDownloadExcel} className="ml-4">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </CardTitle>
        <CardDescription>
          {recordCount} records found{filterText}
          {includeCredentials && " (Including login credentials)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exportResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No records found for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Device Name</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Client</th>
                  <th className="text-left p-3 font-medium">IP/URL</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  {includeCredentials && (
                    <th className="text-left p-3 font-medium">Login Details</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {exportResults.map((record: any) => (
                  <tr
                    key={record.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 text-sm font-medium">
                      {record.device_name}
                    </td>
                    <td className="p-3 text-sm">{record.device_type || "-"}</td>
                    <td className="p-3 text-sm">
                      {record.client_credentials
                        ? record.client_credentials.full_name ||
                          record.client_credentials.username
                        : "Unassigned"}
                    </td>
                    <td className="p-3 text-sm">
                      {record.device_ip_address || record.device_url || "-"}
                    </td>
                    <td className="p-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "active"
                            ? "bg-green-100 text-green-800"
                            : record.status === "maintenance"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{record.location || "-"}</td>
                    {includeCredentials && (
                      <td className="p-3 text-sm">
                        {record.login_username || record.login_password ? (
                          <div className="space-y-1">
                            {record.login_username && (
                              <div>User: {record.login_username}</div>
                            )}
                            {record.login_password && (
                              <div>Pass: {record.login_password}</div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
