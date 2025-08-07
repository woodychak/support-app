"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { createEquipmentAction, updateEquipmentAction } from "@/app/actions";
import { Eye, EyeOff } from "lucide-react";

interface EquipmentFormProps {
  clientCompanyProfiles: any[];
  equipment?: any;
  onSuccess?: () => void;
}

export function EquipmentForm({
  clientCompanyProfiles,
  equipment,
  onSuccess,
}: EquipmentFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!equipment;

  const handleSubmit = async (formData: FormData) => {
    try {
      if (isEditing) {
        formData.append("equipment_id", equipment.id);
        await updateEquipmentAction(formData);
      } else {
        await createEquipmentAction(formData);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device_name">Device Name *</Label>
          <Input
            id="device_name"
            name="device_name"
            placeholder="e.g., Main Server, Router 1"
            defaultValue={equipment?.device_name || ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="device_type">Device Type</Label>
          <Input
            id="device_type"
            name="device_type"
            placeholder="e.g., Server, Router, Switch"
            defaultValue={equipment?.device_type || ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device_ip_address">IP Address</Label>
          <Input
            id="device_ip_address"
            name="device_ip_address"
            placeholder="e.g., 192.168.1.100"
            defaultValue={equipment?.device_ip_address || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="device_url">Device URL</Label>
          <Input
            id="device_url"
            name="device_url"
            placeholder="e.g., https://device.example.com"
            defaultValue={equipment?.device_url || ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="login_username">Login Username</Label>
          <Input
            id="login_username"
            name="login_username"
            placeholder="Username for device access"
            defaultValue={equipment?.login_username || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login_password">Login Password</Label>
          <div className="relative">
            <Input
              id="login_password"
              name="login_password"
              type={showPassword ? "text" : "password"}
              placeholder="Password for device access"
              defaultValue={equipment?.login_password || ""}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_company_profile_id">
            Assign to Client Company
          </Label>
          <Select
            name="client_company_profile_id"
            defaultValue={equipment?.client_company_profile_id || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client company (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {clientCompanyProfiles && clientCompanyProfiles.length > 0 ? (
                clientCompanyProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.company_name}
                    {profile.contact_person && ` - ${profile.contact_person}`}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-companies" disabled>
                  No client companies available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={equipment?.status || "active"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g., Server Room, Office Floor 2"
          defaultValue={equipment?.location || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Additional notes about this equipment"
          defaultValue={equipment?.description || ""}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton
          pendingText={isEditing ? "Updating..." : "Creating..."}
          className="flex-1"
        >
          {isEditing ? "Update Equipment" : "Create Equipment"}
        </SubmitButton>
        {onSuccess && (
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
