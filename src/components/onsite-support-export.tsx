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
import { Download, Filter } from "lucide-react";
import { exportOnsiteSupportAction } from "@/app/actions";

interface ExportResultsProps {
  exportResults: any[] | null;
  filterText: string;
  recordCount: number;
}

export function OnsiteSupportExport() {
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Generate Excel reports for onsite support activities with date
          filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={exportOnsiteSupportAction} className="space-y-4">
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

export function ExportResults({
  exportResults,
  filterText,
  recordCount,
}: ExportResultsProps) {
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
            "Client",
            "Job Details",
          ],
        ];

        exportResultsWithHours.forEach((record: any) => {
          const clientName = record.client_credentials
            ? record.client_credentials.full_name ||
              record.client_credentials.username
            : "No specific client";

          ws_data.push([
            record.engineer_name,
            new Date(record.work_date).toLocaleDateString(),
            record.check_in_time || "",
            record.check_out_time || "",
            record.totalHours || "",
            clientName,
            record.job_details || "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Onsite Support");
        XLSX.writeFile(
          wb,
          `onsite-support-export${filterText.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`,
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
          <span>Export Results{filterText}</span>
          <Button onClick={handleDownloadExcel} className="ml-4">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </CardTitle>
        <CardDescription>
          {recordCount} records found{filterText}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exportResultsWithHours.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No records found for the selected criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exportResultsWithHours.map((record: any) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-medium text-lg">
                        {record.engineer_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>📅</span>
                        {new Date(record.work_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      {record.check_in_time && (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-green-600">⏰</span>
                          <span>In: {record.check_in_time}</span>
                        </div>
                      )}
                      {record.check_out_time && (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-red-600">⏰</span>
                          <span>Out: {record.check_out_time}</span>
                        </div>
                      )}
                      {record.totalHours && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <span className="text-blue-600">⏰</span>
                          <span>Total: {record.totalHours}h</span>
                        </div>
                      )}
                    </div>

                    {record.client_credentials && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <span>👤</span>
                        <span>
                          Client:{" "}
                          {record.client_credentials.full_name ||
                            record.client_credentials.username}
                        </span>
                      </div>
                    )}

                    {record.job_details && (
                      <div className="flex items-start gap-1 text-sm">
                        <span className="text-muted-foreground">📄</span>
                        <p className="text-muted-foreground">
                          {record.job_details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
