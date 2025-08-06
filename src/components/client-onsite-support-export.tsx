"use client";

import { useState } from "react";
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
import { Download, Filter, Calendar, Clock, FileText } from "lucide-react";
import { exportClientOnsiteSupportAction } from "@/app/actions";

interface ClientExportResultsProps {
  exportResults: any[] | null;
  filterText: string;
  recordCount: number;
}

interface ClientOnsiteSupportExportProps {
  clientId: string;
  sessionToken: string;
}

export function ClientOnsiteSupportExport({
  clientId,
  sessionToken,
}: ClientOnsiteSupportExportProps) {
  // Get session token from URL

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Reports
        </CardTitle>
        <CardDescription>
          Generate Excel reports for your onsite support activities with date
          filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={exportClientOnsiteSupportAction} className="space-y-4">
          <input type="hidden" name="client_id" value={clientId} />
          {sessionToken && (
            <input type="hidden" name="session_token" value={sessionToken} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter_type">Filter Type</Label>
              <Select name="filter_type" defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="date_range">Date Range</SelectItem>
                  <SelectItem value="month">Specific Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                placeholder="Start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                placeholder="End date"
              />
            </div>
            <div className="flex items-end">
              <SubmitButton pendingText="Loading..." className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Show Results
              </SubmitButton>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Filter Instructions:</strong>
              <br />• <strong>All Records:</strong> Leave dates empty and select
              "All Records"
              <br />• <strong>Date Range:</strong> Select start and end dates
              <br />• <strong>Specific Month:</strong> Select start date as
              first day of month, end date as last day
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ClientExportResults({
  exportResults,
  filterText,
  recordCount,
}: ClientExportResultsProps) {
  const handleDownloadExcel = () => {
    if (typeof window !== "undefined" && exportResults) {
      import("xlsx").then((XLSX) => {
        // Calculate total hours for export results
        const exportResultsWithHours = exportResults.map((record: any) => {
          let totalHours = null;
          if (record.check_in_time && record.check_out_time) {
            const checkIn = new Date(`2000-01-01T${record.check_in_time}`);
            const checkOut = new Date(`2000-01-01T${record.check_out_time}`);
            const diffMs = checkOut.getTime() - checkIn.getTime();
            totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
          }
          return { ...record, totalHours };
        });

        const ws_data = [
          [
            "Engineer Name",
            "Work Date",
            "Check-in Time",
            "Check-out Time",
            "Total Hours",
            "Job Details",
          ],
        ];

        exportResultsWithHours.forEach((record: any) => {
          ws_data.push([
            record.engineer_name,
            new Date(record.work_date).toLocaleDateString("en-US"),
            record.check_in_time || "",
            record.check_out_time || "",
            record.totalHours || "",
            record.job_details || "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "My Onsite Support");
        XLSX.writeFile(
          wb,
          `my-onsite-support-export${filterText.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`,
        );
      });
    }
  };

  if (!exportResults) {
    return null;
  }

  // Calculate total hours for display
  const exportResultsWithHours = exportResults.map((record: any) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Export Results{filterText}</span>
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-lg">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {exportResultsWithHours
                  .reduce((total, record) => {
                    const hours = parseFloat(record.totalHours || "0");
                    return total + (isNaN(hours) ? 0 : hours);
                  }, 0)
                  .toFixed(1)}
                h total
              </span>
            </div>
          </div>
          <Button onClick={handleDownloadExcel} className="ml-4">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </CardTitle>
        <CardDescription>
          {recordCount} records found{filterText} • Total hours for selected
          period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exportResultsWithHours.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No records found for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Engineer</th>
                  <th className="text-left p-3 font-medium">Check In</th>
                  <th className="text-left p-3 font-medium">Check Out</th>
                  <th className="text-left p-3 font-medium">Total Hours</th>
                  <th className="text-left p-3 font-medium">Job Details</th>
                </tr>
              </thead>
              <tbody>
                {exportResultsWithHours.map((record: any) => (
                  <tr
                    key={record.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 text-sm">{record.work_date}</td>
                    <td className="p-3 text-sm font-medium">
                      {record.engineer_name}
                    </td>
                    <td className="p-3 text-sm">
                      {record.check_in_time || "-"}
                    </td>
                    <td className="p-3 text-sm">
                      {record.check_out_time || "-"}
                    </td>
                    <td className="p-3 text-sm font-medium">
                      {record.totalHours ? `${record.totalHours}h` : "-"}
                    </td>
                    <td className="p-3 text-sm max-w-xs">
                      {record.job_details ? (
                        <div className="truncate" title={record.job_details}>
                          {record.job_details}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
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
