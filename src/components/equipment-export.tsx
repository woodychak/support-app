"use client";

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
import { exportEquipmentAction } from "@/app/actions";

export function EquipmentExport() {
  return (
    <div>
      <form action={exportEquipmentAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filter_type">Filter Type</Label>
            <Select name="filter_type" defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="client">By Client</SelectItem>
                <SelectItem value="type">By Device Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter_value">Filter Value</Label>
            <Input
              id="filter_value"
              name="filter_value"
              placeholder="Enter filter value"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="include_credentials">Include Login Details</Label>
            <Select name="include_credentials" defaultValue="false">
              <SelectTrigger>
                <SelectValue placeholder="Include credentials?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No (Secure)</SelectItem>
                <SelectItem value="true">Yes (Full Export)</SelectItem>
              </SelectContent>
            </Select>
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
            <br />• <strong>All Equipment:</strong> Export all equipment records
            <br />• <strong>By Status:</strong> Enter status (active, inactive,
            maintenance)
            <br />• <strong>By Client:</strong> Enter client name or username
            (partial matches supported)
            <br />• <strong>By Device Type:</strong> Enter device type (server,
            router, switch, etc.)
            <br />• <strong>Login Details:</strong> Choose whether to include
            sensitive login credentials in the export
          </p>
        </div>
      </form>
    </div>
  );
}
