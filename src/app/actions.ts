"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  console.log("After signUp", error);

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        name: fullName,
        full_name: fullName,
        email: email,
        user_id: user.id,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } catch (err) {
      console.error("Error in user profile creation:", err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const createCompanyAction = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!name) {
    return encodedRedirect(
      "error",
      "/dashboard/company",
      "Company name is required",
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating company:", error);
    return encodedRedirect(
      "error",
      "/dashboard/company",
      "Failed to create company",
    );
  }

  // Update user's company_id
  await supabase
    .from("users")
    .update({ company_id: data.id, user_type: "admin" })
    .eq("id", user.id);

  return encodedRedirect(
    "success",
    "/dashboard",
    "Company created successfully",
  );
};

export const createClientCredentialAction = async (formData: FormData) => {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const email = formData.get("email")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!username || !password) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Username and password are required",
    );
  }

  // Get user's company
  const { data: userData } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "You must have a company to create client credentials",
    );
  }

  // Simple password hashing (in production, use bcrypt)
  const passwordHash = Buffer.from(password).toString("base64");

  const { error } = await supabase.from("client_credentials").insert({
    company_id: userData.company_id,
    username,
    password_hash: passwordHash,
    email,
    full_name: fullName,
  });

  if (error) {
    console.error("Error creating client credential:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to create client credential",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client credential created successfully",
  );
};

export const clientSignInAction = async (formData: FormData) => {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();

  if (!username || !password) {
    return encodedRedirect(
      "error",
      "/client-portal",
      "Username and password are required",
    );
  }

  // Simple password verification (in production, use bcrypt)
  const passwordHash = Buffer.from(password).toString("base64");

  const { data: clientData, error } = await supabase
    .from("client_credentials")
    .select("*, companies(*)")
    .eq("username", username)
    .eq("password_hash", passwordHash)
    .eq("is_active", true)
    .single();

  if (error || !clientData) {
    return encodedRedirect("error", "/client-portal", "Invalid credentials");
  }

  // Store client session (simplified - in production use proper session management)
  return redirect(`/client-portal/dashboard?client_id=${clientData.id}`);
};

export const updateUserProfileAction = async (formData: FormData) => {
  const fullName = formData.get("full_name")?.toString();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/profile", "You must be logged in");
  }

  // Update user profile in users table
  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      name: name,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Error updating user profile:", profileError);
    return encodedRedirect("error", "/profile", "Failed to update profile");
  }

  // Update email in auth if changed
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: email,
    });

    if (emailError) {
      console.error("Error updating email:", emailError);
      return encodedRedirect(
        "error",
        "/profile",
        "Profile updated but email change failed",
      );
    }
  }

  return encodedRedirect("success", "/profile", "Profile updated successfully");
};

export const createSupportTicketAction = async (formData: FormData) => {
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const priority = formData.get("priority")?.toString();
  const clientId = formData.get("client_id")?.toString();
  const supabase = await createClient();

  if (!title || !description || !priority || !clientId) {
    return encodedRedirect(
      "error",
      `/client-portal/tickets/new?client_id=${clientId}`,
      "All fields are required",
    );
  }

  // Get client data to verify and get company_id
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("company_id")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !clientData) {
    return encodedRedirect(
      "error",
      `/client-portal/tickets/new?client_id=${clientId}`,
      "Invalid client credentials",
    );
  }

  // Create the support ticket
  const { error } = await supabase.from("support_tickets").insert({
    title,
    description,
    priority,
    status: "open",
    company_id: clientData.company_id,
    client_credential_id: clientId,
  });

  if (error) {
    console.error("Error creating support ticket:", error);
    return encodedRedirect(
      "error",
      `/client-portal/tickets/new?client_id=${clientId}`,
      "Failed to create support ticket",
    );
  }

  return redirect(`/client-portal/dashboard?client_id=${clientId}`);
};

export const updateSupportTicketAction = async (formData: FormData) => {
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const priority = formData.get("priority")?.toString();
  const ticketId = formData.get("ticket_id")?.toString();
  const clientId = formData.get("client_id")?.toString();
  const supabase = await createClient();

  if (!title || !description || !priority || !ticketId || !clientId) {
    return encodedRedirect(
      "error",
      `/client-portal/tickets/${ticketId}?client_id=${clientId}`,
      "All fields are required",
    );
  }

  // Verify client owns this ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("client_credential_id", clientId)
    .single();

  if (ticketError || !ticketData) {
    return encodedRedirect(
      "error",
      `/client-portal/dashboard?client_id=${clientId}`,
      "Ticket not found or access denied",
    );
  }

  // Update the support ticket
  const { error } = await supabase
    .from("support_tickets")
    .update({
      title,
      description,
      priority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating support ticket:", error);
    return encodedRedirect(
      "error",
      `/client-portal/tickets/${ticketId}?client_id=${clientId}`,
      "Failed to update support ticket",
    );
  }

  return redirect(`/client-portal/tickets/${ticketId}?client_id=${clientId}`);
};

export const addTicketCommentAction = async (formData: FormData) => {
  const content = formData.get("content")?.toString();
  const ticketId = formData.get("ticket_id")?.toString();
  const authorType = formData.get("author_type")?.toString();
  const authorId = formData.get("author_id")?.toString();
  const isInternal = formData.get("is_internal") === "true";
  const supabase = await createClient();

  if (!content || !ticketId || !authorType) {
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Comment content is required",
    );
  }

  // Add the comment
  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    content,
    author_type: authorType,
    author_id: authorId,
    is_internal: isInternal,
  });

  if (error) {
    console.error("Error adding comment:", error);
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Failed to add comment",
    );
  }

  return redirect(`/dashboard/tickets/${ticketId}`);
};

export const updateTicketStatusAction = async (formData: FormData) => {
  const status = formData.get("status")?.toString();
  const ticketId = formData.get("ticket_id")?.toString();
  const supabase = await createClient();

  if (!status || !ticketId) {
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Status is required",
    );
  }

  // Update ticket status
  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating ticket status:", error);
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Failed to update ticket status",
    );
  }

  return redirect(`/dashboard/tickets/${ticketId}`);
};
