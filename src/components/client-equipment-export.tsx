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
import { exportClientEquipmentAction } from "@/app/actions";

interface ClientEquipmentExportProps {
  clientId: string;
}

export function ClientEquipmentExport({
  clientId,
}: ClientEquipmentExportProps) {
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Equipment
        </CardTitle>
        <CardDescription>
          Generate Excel reports for your equipment inventory with filtering
          options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={exportClientEquipmentAction} className="space-y-4">
          <input type="hidden" name="client_id" value={clientId} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter_type">Filter Type</Label>
              <Select name="filter_type" defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
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
              <br />• <strong>All Equipment:</strong> Export all your equipment
              records
              <br />• <strong>By Status:</strong> Enter status (active,
              inactive, maintenance)
              <br />• <strong>By Device Type:</strong> Enter device type
              (server, router, switch, etc.) - partial matches supported
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
