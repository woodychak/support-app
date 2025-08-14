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
import { downloadClientOnsiteExcelAction } from "@/app/actions-client-excel";

interface ClientOnsiteSupportExportProps {
  clientId: string;
  sessionToken: string;
}

export function ClientOnsiteSupportExport({
  clientId,
  sessionToken,
}: ClientOnsiteSupportExportProps) {
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
        <form
          action="/api/client-onsite-excel" method="POST"
          className="space-y-4"
        >
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
              <SubmitButton
                pendingText="Generating Excel..."
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Excel
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
