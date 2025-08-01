"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Monitor, Globe, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ClientEquipmentTableProps {
  equipment: any[];
  showDownloadButton?: boolean;
}

export function ClientEquipmentTable({
  equipment,
  showDownloadButton = false,
}: ClientEquipmentTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );
  const { toast } = useToast();

  const togglePasswordVisibility = (equipmentId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(equipmentId)) {
      newVisible.delete(equipmentId);
    } else {
      newVisible.add(equipmentId);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadExcel = () => {
    if (typeof window !== "undefined" && equipment) {
      import("xlsx").then((XLSX) => {
        const ws_data = [
          [
            "Device Name",
            "Device Type",
            "IP Address/URL",
            "Status",
            "Location",
            "Description",
          ],
        ];

        equipment.forEach((record: any) => {
          ws_data.push([
            record.device_name,
            record.device_type || "",
            record.device_ip_address || record.device_url || "",
            record.status,
            record.location || "",
            record.description || "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment Inventory");
        XLSX.writeFile(
          wb,
          `equipment-inventory-${new Date().toISOString().split("T")[0]}.xlsx`,
        );
      });
    }
  };

  return (
    <div className="space-y-4">
      {showDownloadButton && (
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>IP/URL</TableHead>
              <TableHead>Login Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => {
              const isPasswordVisible = (equipmentId: string) => {
                return visiblePasswords.has(equipmentId);
              };
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      {item.device_name}
                    </div>
                  </TableCell>
                  <TableCell>{item.device_type || "-"}</TableCell>
                  <TableCell>
                    {item.device_ip_address || item.device_url ? (
                      <div className="flex items-center gap-2">
                        {item.device_url && (
                          <Globe className="h-3 w-3 text-blue-500" />
                        )}
                        <span className="text-sm font-mono">
                          {item.device_ip_address || item.device_url}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              item.device_ip_address || item.device_url,
                              "Address",
                            )
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {item.login_username || item.login_password ? (
                      <div className="space-y-1">
                        {item.login_username && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              User:
                            </span>
                            <span className="text-sm">
                              {item.login_username}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(item.login_username, "Username")
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {item.login_password && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Pass:
                            </span>
                            <span className="text-sm font-mono">
                              {isPasswordVisible(item.id)
                                ? item.login_password
                                : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isPasswordVisible(item.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(item.login_password, "Password")
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.location || "-"}</TableCell>
                  <TableCell className="max-w-xs">
                    {item.description ? (
                      <div className="truncate" title={item.description}>
                        {item.description}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
