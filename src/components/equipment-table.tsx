"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Search,
  Filter,
} from "lucide-react";
import { deleteEquipmentAction } from "@/app/actions";
import { EquipmentForm } from "./equipment-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface EquipmentTableProps {
  equipment: any[];
  clientCompanyProfiles: any[];
}

export function EquipmentTable({
  equipment,
  clientCompanyProfiles,
}: EquipmentTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{
    [id: string]: boolean;
  }>({});
  const [includeCredentials, setIncludeCredentials] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientCompany, setSelectedClientCompany] =
    useState<string>("all");
  const filterText =
    selectedClientCompany !== "all" ? selectedClientCompany : "all-companies";
  const { toast } = useToast();

  const handleDelete = (equipment: any) => {
    setSelectedEquipment(equipment);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (equipment: any) => {
    setSelectedEquipment(equipment);
    setEditDialogOpen(true);
  };

  const togglePasswordVisibility = (equipmentId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [equipmentId]: !prev[equipmentId],
    }));
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
    if (typeof window !== "undefined" && filteredEquipment.length > 0) {
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

        filteredEquipment.forEach((record: any) => {
          const row = [
            record.device_name,
            record.device_type || "",
            record.client_company_profiles
              ? record.client_company_profiles.company_name
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
        XLSX.writeFile(wb, `equipment-inventory-${filterText}.xlsx`);
      });
    }
  };

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.device_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClient =
        selectedClientCompany === "all" ||
        String(item.client_company_profile_id) === selectedClientCompany;

      return matchesSearch && matchesClient;
    });
  }, [equipment, searchTerm, selectedClientCompany]);

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search equipment by name, type, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadExcel} variant="outline">
            Download
          </Button>
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={selectedClientCompany}
            onValueChange={setSelectedClientCompany}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by client company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Client Companies</SelectItem>
              {clientCompanyProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client Company</TableHead>
              <TableHead>IP/URL</TableHead>
              <TableHead>Login Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {equipment.length === 0
                      ? "No equipment found. Add your first equipment item."
                      : "No equipment matches your search criteria."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((item) => {
                const isPasswordVisible = (equipmentId: string) => {
                  return visiblePasswords[equipmentId] ?? false;
                };
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.device_name}
                    </TableCell>
                    <TableCell>{item.device_type || "-"}</TableCell>
                    <TableCell>
                      {item.client_company_profiles
                        ? item.client_company_profiles.company_name
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {item.device_ip_address || item.device_url ? (
                        <div className="flex items-center gap-2">
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
                                  copyToClipboard(
                                    item.login_username,
                                    "Username",
                                  )
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
                                onClick={() =>
                                  togglePasswordVisibility(item.id)
                                }
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
                                  copyToClipboard(
                                    item.login_password,
                                    "Password",
                                  )
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {selectedEquipment?.device_name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedEquipment) {
                  const formData = new FormData();
                  formData.append("equipment_id", selectedEquipment.id);
                  deleteEquipmentAction(formData);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update the equipment details</DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <EquipmentForm
              clientCompanyProfiles={clientCompanyProfiles}
              equipment={selectedEquipment}
              onSuccess={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
