"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "../../supabase/server";

export const createClientCompanyProfileAction = async (formData: FormData) => {
  const companyName = formData.get("company_name")?.toString();
  const contactPerson = formData.get("contact_person")?.toString();
  const contactEmail = formData.get("contact_email")?.toString();
  const contactPhone = formData.get("contact_phone")?.toString();
  const address = formData.get("address")?.toString();
  const description = formData.get("description")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!companyName) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Company name is required",
    );
  }

  const { data, error } = await supabase
    .from("client_company_profiles")
    .insert({
      company_name: companyName,
      contact_person: contactPerson,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address: address,
      description: description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating client company profile:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to create client company profile",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client company profile created successfully",
  );
};

export const updateClientCompanyProfileAction = async (formData: FormData) => {
  const profileId = formData.get("profile_id")?.toString();
  const companyName = formData.get("company_name")?.toString();
  const contactPerson = formData.get("contact_person")?.toString();
  const contactEmail = formData.get("contact_email")?.toString();
  const contactPhone = formData.get("contact_phone")?.toString();
  const address = formData.get("address")?.toString();
  const description = formData.get("description")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!profileId || !companyName) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Profile ID and company name are required",
    );
  }

  const { error } = await supabase
    .from("client_company_profiles")
    .update({
      company_name: companyName,
      contact_person: contactPerson,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address: address,
      description: description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    console.error("Error updating client company profile:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to update client company profile",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client company profile updated successfully",
  );
};

export const deleteClientCompanyProfileAction = async (formData: FormData) => {
  const profileId = formData.get("profile_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!profileId) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Profile ID is required",
    );
  }

  // Check if there are any client credentials linked to this profile
  const { data: linkedCredentials } = await supabase
    .from("client_credentials")
    .select("id")
    .eq("client_company_profile_id", profileId);

  if (linkedCredentials && linkedCredentials.length > 0) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Cannot delete profile with linked client credentials",
    );
  }

  const { error } = await supabase
    .from("client_company_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("Error deleting client company profile:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to delete client company profile",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client company profile deleted successfully",
  );
};
