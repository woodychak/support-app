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
import { Eye, EyeOff, Copy, Monitor, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ClientEquipmentTableProps {
  equipment: any[];
}

export function ClientEquipmentTable({ equipment }: ClientEquipmentTableProps) {
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

  return (
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
            const isPasswordVisible = visiblePasswords.has(item.id);
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
                  <span className="text-sm text-muted-foreground">Hidden</span>
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
  );
}
