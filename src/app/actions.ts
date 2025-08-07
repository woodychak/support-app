"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encrypt, decrypt } from "@/utils/encryption";

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

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Ensure user record exists in users table
  if (authData.user) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    // If user doesn't exist in users table, create it
    if (!existingUser) {
      const { error: createUserError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name || "",
        name: authData.user.user_metadata?.full_name || "",
        token_identifier: authData.user.id,
        user_id: authData.user.id,
        created_at: new Date().toISOString(),
      });

      if (createUserError) {
        console.error("Error creating user record:", createUserError);
      }
    }
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
  const role = formData.get("role")?.toString() || "user";
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString();
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
    role,
    client_company_profile_id: clientCompanyProfileId || null,
    is_active: true,
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

export const updateClientCredentialAction = async (formData: FormData) => {
  const clientId = formData.get("client_id")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const email = formData.get("email")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const role = formData.get("role")?.toString() || "user";
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString();
  const isActive = formData.get("is_active") === "on";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!clientId || !username) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Client ID and username are required",
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
      "You must have a company to update client credentials",
    );
  }

  // Verify client belongs to user's company
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("id")
    .eq("id", clientId)
    .eq("company_id", userData.company_id)
    .single();

  if (clientError || !clientData) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Client credential not found or access denied",
    );
  }

  // Prepare update data
  const updateData: any = {
    username,
    email,
    full_name: fullName,
    role,
    client_company_profile_id: clientCompanyProfileId || null,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  // Add password hash if password is provided
  if (password) {
    updateData.password_hash = Buffer.from(password).toString("base64");
  }

  const { error } = await supabase
    .from("client_credentials")
    .update(updateData)
    .eq("id", clientId);

  if (error) {
    console.error("Error updating client credential:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to update client credential",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client credential updated successfully",
  );
};

export const deleteClientCredentialAction = async (formData: FormData) => {
  const clientId = formData.get("client_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!clientId) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Client ID is required",
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
      "You must have a company to delete client credentials",
    );
  }

  // Verify client belongs to user's company
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("id")
    .eq("id", clientId)
    .eq("company_id", userData.company_id)
    .single();

  if (clientError || !clientData) {
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Client credential not found or access denied",
    );
  }

  // Delete the client credential
  const { error } = await supabase
    .from("client_credentials")
    .delete()
    .eq("id", clientId);

  if (error) {
    console.error("Error deleting client credential:", error);
    return encodedRedirect(
      "error",
      "/dashboard/clients",
      "Failed to delete client credential",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/clients",
    "Client credential deleted successfully",
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
    .select("*, companies(*), client_company_profiles(*)")
    .eq("username", username)
    .eq("password_hash", passwordHash)
    .eq("is_active", true)
    .single();

  if (error || !clientData) {
    return encodedRedirect("error", "/client-portal", "Invalid credentials");
  }

  // Generate a secure session token
  const sessionToken = Buffer.from(
    `${clientData.id}:${Date.now()}:${Math.random().toString(36)}`,
  ).toString("base64");

  // Store session in database with expiration (24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("client_sessions").insert({
    client_id: clientData.id,
    session_token: sessionToken,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });

  // Store client session with role information and session token
  return redirect(
    `/client-portal/dashboard?client_id=${clientData.id}&role=${clientData.role}&session=${encodeURIComponent(sessionToken)}`,
  );
};

export const clientSignOutAction = async (formData: FormData) => {
  const sessionToken = formData.get("session_token")?.toString();
  const supabase = await createClient();

  if (sessionToken) {
    // Invalidate the session in database
    await supabase
      .from("client_sessions")
      .delete()
      .eq("session_token", sessionToken);
  }

  return redirect("/client-portal");
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
  const staffName = formData.get("staff_name")?.toString();
  const staffEmail = formData.get("staff_email")?.toString();
  const supabase = await createClient();

  if (
    !title ||
    !description ||
    !priority ||
    !clientId ||
    !staffName ||
    !staffEmail
  ) {
    return encodedRedirect(
      "error",
      `/client-portal/tickets/new?client_id=${clientId}`,
      "All fields are required",
    );
  }

  // Get client data to verify and get company_id
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("company_id, username, full_name, email, companies(name, owner_id)")
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
  const { data: ticketData, error } = await supabase
    .from("support_tickets")
    .insert({
      title,
      description,
      priority,
      status: "open",
      company_id: clientData.company_id,
      client_credential_id: clientId,
      staff_name: staffName,
      staff_email: staffEmail,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating support ticket:", error);
    return encodedRedirect(
      "error",
      `/client-portal/tickets/new?client_id=${clientId}`,
      "Failed to create support ticket",
    );
  }

  // Send email notification to company owner
  const company = clientData.companies?.[0];

  if (company?.owner_id && ticketData) {
    // Get company owner's email
    const { data: ownerData } = await supabase
      .from("users")
      .select("email")
      .eq("id", company.owner_id)
      .single();

    if (ownerData?.email) {
      const clientName = clientData.full_name || clientData.username;
      const subject = `New Support Ticket: ${title}`;
      const body = `
        A new support ticket has been created by ${clientName}.
        
        Ticket Details:
        - Title: ${title}
        - Priority: ${priority}
        - Status: Open
        
        Description:
        ${description}
        
        Please log in to your dashboard to respond.
      `;

      // Log the email notification in the database
      await supabase.from("email_notifications").insert({
        recipient_email: ownerData.email,
        subject,
        body,
        status: "pending",
        ticket_id: ticketData.id,
      });

      // In a real application, you would send the actual email here
      // using an email service like SendGrid, AWS SES, etc.
    }
  }

  return redirect(`/client-portal/dashboard?client_id=${clientId}`);
};

export const deleteSupportTicketAction = async (formData: FormData) => {
  const ticketId = formData.get("ticket_id")?.toString();
  const clientId = formData.get("client_id")?.toString(); // 方便驗證公司用

  const supabase = await createClient();

  if (!ticketId || !clientId) {
    return encodedRedirect(
      "error",
      `/client-portal/dashboard?client_id=${clientId ?? ""}`,
      "Missing ticket information.",
    );
  }

  /* ① 先確認 client 有權限刪這張票 */
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("company_id")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !clientData) {
    return encodedRedirect(
      "error",
      `/client-portal/dashboard?client_id=${clientId}`,
      "Invalid client credentials.",
    );
  }

  /* ② 確認 ticket 是在同一家公司 */
  const { data: ticketRow, error: ticketErr } = await supabase
    .from("support_tickets")
    .select("id, company_id")
    .eq("id", ticketId)
    .single();

  if (
    ticketErr ||
    !ticketRow ||
    ticketRow.company_id !== clientData.company_id
  ) {
    return encodedRedirect(
      "error",
      `/client-portal/dashboard?client_id=${clientId}`,
      "Ticket not found or permission denied.",
    );
  }

  /* ③ 執行刪除（若關聯表沒設 CASCADE 可自行手動刪） */
  const { error: deleteError } = await supabase
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (deleteError) {
    console.error("Delete ticket error:", deleteError);
    return encodedRedirect(
      "error",
      `/client-portal/dashboard?client_id=${clientId}`,
      "Failed to delete ticket.",
    );
  }

  /* ④ 刪除成功 → 回到票列表 */
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
  const attachments = formData.get("attachments")?.toString();
  const supabase = await createClient();

  if (!content || !ticketId || !authorType) {
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Comment content is required",
    );
  }

  // Add the comment
  const { data: commentData, error } = await supabase
    .from("ticket_comments")
    .insert({
      ticket_id: ticketId,
      content,
      author_type: authorType,
      author_id: authorId,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return encodedRedirect(
      "error",
      `/dashboard/tickets/${ticketId}`,
      "Failed to add comment",
    );
  }

  // Process attachments if any
  if (attachments && commentData) {
    const attachmentPaths = attachments.split(",").filter(Boolean);

    if (attachmentPaths.length > 0) {
      const attachmentsToInsert = attachmentPaths.map((path) => {
        const fileName = path.split("/").pop() || "unknown";
        const fileType = fileName.includes(".")
          ? fileName.split(".").pop() || "unknown"
          : "unknown";

        return {
          ticket_id: ticketId,
          comment_id: commentData.id,
          file_path: path,
          file_name: fileName,
          file_type: fileType,
          file_size: 0, // We don't have the size here, but it's required
          created_by: authorId,
        };
      });

      const { error: attachmentError } = await supabase
        .from("ticket_attachments")
        .insert(attachmentsToInsert);

      if (attachmentError) {
        console.error("Error saving attachments:", attachmentError);
      }
    }
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

export const deleteTicketCommentAction = async (formData: FormData) => {
  const commentId = formData.get("comment_id")?.toString();
  const ticketId = formData.get("ticket_id")?.toString();
  const authorId = formData.get("author_id")?.toString();
  const authorType = formData.get("author_type")?.toString();
  const clientId = formData.get("client_id")?.toString();
  const supabase = await createClient();

  if (!commentId || !ticketId || !authorId || !authorType) {
    const redirectPath =
      authorType === "client"
        ? `/client-portal/tickets/${ticketId}?client_id=${clientId}`
        : `/dashboard/tickets/${ticketId}`;
    return encodedRedirect(
      "error",
      redirectPath,
      "Missing required information",
    );
  }

  // Get the comment to verify ownership
  const { data: comment, error: commentError } = await supabase
    .from("ticket_comments")
    .select("id, author_id, author_type, ticket_id")
    .eq("id", commentId)
    .single();

  if (commentError || !comment) {
    const redirectPath =
      authorType === "client"
        ? `/client-portal/tickets/${ticketId}?client_id=${clientId}`
        : `/dashboard/tickets/${ticketId}`;
    return encodedRedirect("error", redirectPath, "Comment not found");
  }

  // Verify ownership - users can only delete their own comments
  if (comment.author_id !== authorId || comment.author_type !== authorType) {
    const redirectPath =
      authorType === "client"
        ? `/client-portal/tickets/${ticketId}?client_id=${clientId}`
        : `/dashboard/tickets/${ticketId}`;
    return encodedRedirect(
      "error",
      redirectPath,
      "You can only delete your own comments",
    );
  }

  // Delete associated attachments first
  const { error: attachmentError } = await supabase
    .from("ticket_attachments")
    .delete()
    .eq("comment_id", commentId);

  if (attachmentError) {
    console.error("Error deleting comment attachments:", attachmentError);
  }

  // Delete the comment
  const { error: deleteError } = await supabase
    .from("ticket_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    console.error("Error deleting comment:", deleteError);
    const redirectPath =
      authorType === "client"
        ? `/client-portal/tickets/${ticketId}?client_id=${clientId}`
        : `/dashboard/tickets/${ticketId}`;
    return encodedRedirect("error", redirectPath, "Failed to delete comment");
  }

  // Redirect back to the ticket
  const redirectPath =
    authorType === "client"
      ? `/client-portal/tickets/${ticketId}?client_id=${clientId}`
      : `/dashboard/tickets/${ticketId}`;
  return redirect(redirectPath);
};

// Onsite Support Actions
export const addOnsiteSupportAction = async (formData: FormData) => {
  const engineerName = formData.get("engineer_name")?.toString();
  const workDate = formData.get("work_date")?.toString();
  const checkInTime = formData.get("check_in_time")?.toString();
  const checkOutTime = formData.get("check_out_time")?.toString();
  const jobDetails = formData.get("job_details")?.toString();
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!engineerName || !workDate) {
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Engineer name and work date are required",
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
      "/dashboard/onsite-support",
      "You must have a company to add onsite support records",
    );
  }

  // Verify client company profile exists if selected
  if (clientCompanyProfileId && clientCompanyProfileId !== "none") {
    const { data: profileData, error: profileError } = await supabase
      .from("client_company_profiles")
      .select("id")
      .eq("id", clientCompanyProfileId)
      .single();

    if (profileError || !profileData) {
      return encodedRedirect(
        "error",
        "/dashboard/onsite-support",
        "Invalid client company selection",
      );
    }
  }

  const { error } = await supabase.from("onsite_support").insert({
    engineer_name: engineerName,
    work_date: workDate,
    check_in_time: checkInTime || null,
    check_out_time: checkOutTime || null,
    job_details: jobDetails || null,
    client_company_profile_id:
      clientCompanyProfileId && clientCompanyProfileId !== "none"
        ? clientCompanyProfileId
        : null,
    company_id: userData.company_id,
  });

  if (error) {
    console.error("Error adding onsite support record:", error);
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Failed to add onsite support record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/onsite-support",
    "Onsite support record added successfully",
  );
};

export const deleteOnsiteSupportAction = async (formData: FormData) => {
  const recordId = formData.get("record_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!recordId) {
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Record ID is required",
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
      "/dashboard/onsite-support",
      "You must have a company to delete onsite support records",
    );
  }

  // Verify record belongs to user's company
  const { data: recordData, error: recordError } = await supabase
    .from("onsite_support")
    .select("id")
    .eq("id", recordId)
    .eq("company_id", userData.company_id)
    .single();

  if (recordError || !recordData) {
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Record not found or access denied",
    );
  }

  // Delete the record
  const { error } = await supabase
    .from("onsite_support")
    .delete()
    .eq("id", recordId);

  if (error) {
    console.error("Error deleting onsite support record:", error);
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Failed to delete onsite support record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/onsite-support",
    "Onsite support record deleted successfully",
  );
};

// Staff Account Actions
export const createStaffAccountAction = async (formData: FormData) => {
  console.log("✅ createStaffAccountAction called");

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const fullName = formData.get("full_name")?.toString().trim();
  const userType = formData.get("user_type")?.toString().trim();
  const password = formData.get("password")?.toString();

  // 基本欄位檢查
  if (!email || !fullName || !userType || !password) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Missing required fields.",
    );
  }

  // Email 格式驗證
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Invalid email format.",
    );
  }

  // 密碼長度檢查
  if (password.length < 8) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Password must be at least 8 characters.",
    );
  }

  const supabase = await createClient();

  // 取得目前登入用戶
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();
  console.log("Current logged in user ID:", user?.id);

  if (!user || getUserError) {
    console.error("Failed to get current user:", getUserError);
    return encodedRedirect("error", "/dashboard", "You must be logged in.");
  }

  // 取得目前用戶資料 (檢查公司及權限)
  const { data: currentUserData, error: currentUserError } = await supabase
    .from("users")
    .select("company_id, user_type")
    .eq("id", user.id)
    .single();

  if (currentUserError || !currentUserData?.company_id) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Missing company or user data.",
    );
  }

  if (currentUserData.user_type !== "admin") {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Only administrators can create staff accounts.",
    );
  }

  // 檢查 Auth 內是否已有此 email 使用者
  const { data: listUsersData, error: listUsersError } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (listUsersError) {
    console.error("Failed to list users:", listUsersError);
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Failed to check existing users.",
    );
  }

  const userExists = listUsersData?.users.some((user) => user.email === email);

  if (userExists) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "User already exists with this email.",
    );
  }

  try {
    console.log("🔧 Creating auth user:", email);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, email },
      });

    if (authError) {
      console.error("❌ Auth user creation error:", authError);
      // 直接呼叫 encodedRedirect，跳轉後不會繼續往下執行
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        `Auth error: ${authError.message}`,
      );
    }

    if (!authData?.user) {
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "No user data returned from auth API.",
      );
    }

    // Also update the company_id as a backup
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        company_id: currentUserData.company_id,
        user_type: userType,
        email_confirmed: true,
      })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("❌ Failed to update user info:", updateError);
      // This is just a backup update, so we don't fail if it doesn't work
      // since we already inserted the data above
    }

    return encodedRedirect(
      "success",
      "/dashboard/staff",
      "Staff account created successfully.",
    );
  } catch (err) {
    // 如果是 Next.js redirect 拋錯就不處理，直接拋出
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as any).digest === "string" &&
      (err as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("❗ Unexpected error:", err);
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Unexpected error occurred.",
    );
  }
};

export const updateStaffAccountAction = async (formData: FormData) => {
  const staffId = formData.get("staff_id")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const userType = formData.get("user_type")?.toString();
  const email = formData.get("email")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (!user || getUserError) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!staffId || !fullName || !userType) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Staff ID, full name, and user type are required",
    );
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Invalid email format",
      );
    }
  }

  // Use supabaseAdmin to get current user data
  const { data: currentUserData, error: userError } = await supabaseAdmin
    .from("users")
    .select("company_id, user_type")
    .eq("id", user.id)
    .single();

  if (userError || !currentUserData?.company_id) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "You must have a company to update staff accounts",
    );
  }

  if (currentUserData.user_type !== "admin") {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Only administrators can update staff accounts",
    );
  }

  // Use supabaseAdmin to verify staff member exists and belongs to same company
  const { data: staffData, error: staffError } = await supabaseAdmin
    .from("users")
    .select("id, company_id, email")
    .eq("id", staffId)
    .single();

  if (staffError || !staffData) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Staff member not found",
    );
  }

  if (staffData.company_id !== currentUserData.company_id) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Access denied - staff member not in your company",
    );
  }

  try {
    // Update email in Supabase Auth if email is provided and different
    if (email && email !== staffData.email) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(staffId, {
          email: email,
        });

      if (authUpdateError) {
        console.error("Error updating auth email:", authUpdateError);
        return encodedRedirect(
          "error",
          "/dashboard/staff",
          "Failed to update email in authentication system",
        );
      }
    }

    // Update user data in users table
    const updateData: any = {
      full_name: fullName,
      name: fullName,
      user_type: userType,
      updated_at: new Date().toISOString(),
    };

    // Add email to update data if provided
    if (email) {
      updateData.token_identifier = email;
      updateData.email = email;
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", staffId);

    if (updateError) {
      console.error("Error updating staff account:", updateError);
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Failed to update staff account",
      );
    }

    return encodedRedirect(
      "success",
      "/dashboard/staff",
      "Staff account updated successfully",
    );
  } catch (err) {
    // 如果是 Next.js redirect 拋錯就不處理，直接拋出
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as any).digest === "string" &&
      (err as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("Unexpected error updating staff:", err);
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "An unexpected error occurred while updating the staff account",
    );
  }
};

export const deleteStaffAccountAction = async (formData: FormData) => {
  const staffId = formData.get("staff_id")?.toString();
  const currentUserId = formData.get("current_user_id")?.toString();

  if (!staffId || !currentUserId) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Missing required data",
    );
  }

  try {
    // Use supabaseAdmin to check current user permissions
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from("users")
      .select("company_id, user_type")
      .eq("id", currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Failed to verify user permissions",
      );
    }

    if (currentUser.user_type !== "admin") {
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Only administrators can delete staff accounts",
      );
    }

    // Use supabaseAdmin to get staff user data
    const { data: staffUser, error: staffUserError } = await supabaseAdmin
      .from("users")
      .select("id, user_id, company_id, email")
      .eq("id", staffId)
      .single();

    if (staffUserError || !staffUser) {
      console.error("Error fetching staff user:", staffUserError);
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Staff member not found",
      );
    }

    if (staffUser.company_id !== currentUser.company_id) {
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Access denied - staff member not in your company",
      );
    }

    // 1. Delete Auth User (using Supabase Admin)
    if (staffUser.user_id || staffUser.id) {
      const userIdToDelete = staffUser.user_id || staffUser.id;
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
      if (authError) {
        console.error("Error deleting auth user:", authError);
      }
    }

    // 2. Delete users table record
    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", staffId);

    if (deleteError) {
      console.error("Error deleting user record:", deleteError);
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Failed to delete user record from database",
      );
    }

    return encodedRedirect(
      "success",
      "/dashboard/staff",
      "Staff account deleted successfully",
    );
  } catch (err) {
    // 如果是 Next.js redirect 拋錯就不處理，直接拋出
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as any).digest === "string" &&
      (err as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("Unexpected error deleting staff:", err);
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "An unexpected error occurred while deleting the staff account",
    );
  }
};

export const updateOnsiteSupportAction = async (formData: FormData) => {
  const recordId = formData.get("record_id")?.toString();
  const engineerName = formData.get("engineer_name")?.toString();
  const workDate = formData.get("work_date")?.toString();
  const checkInTime = formData.get("check_in_time")?.toString();
  const checkOutTime = formData.get("check_out_time")?.toString();
  const jobDetails = formData.get("job_details")?.toString();
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!recordId || !engineerName || !workDate) {
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Record ID, engineer name and work date are required",
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
      "/dashboard/onsite-support",
      "You must have a company to update onsite support records",
    );
  }

  // Verify record belongs to user's company
  const { data: recordData, error: recordError } = await supabase
    .from("onsite_support")
    .select("id")
    .eq("id", recordId)
    .eq("company_id", userData.company_id)
    .single();

  if (recordError || !recordData) {
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Record not found or access denied",
    );
  }

  // Verify client company profile exists if selected
  if (clientCompanyProfileId && clientCompanyProfileId !== "none") {
    const { data: profileData, error: profileError } = await supabase
      .from("client_company_profiles")
      .select("id")
      .eq("id", clientCompanyProfileId)
      .single();

    if (profileError || !profileData) {
      return encodedRedirect(
        "error",
        "/dashboard/onsite-support",
        "Invalid client company selection",
      );
    }
  }

  const { error } = await supabase
    .from("onsite_support")
    .update({
      engineer_name: engineerName,
      work_date: workDate,
      check_in_time: checkInTime || null,
      check_out_time: checkOutTime || null,
      job_details: jobDetails || null,
      client_company_profile_id:
        clientCompanyProfileId && clientCompanyProfileId !== "none"
          ? clientCompanyProfileId
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (error) {
    console.error("Error updating onsite support record:", error);
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Failed to update onsite support record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/onsite-support?updated=true",
    "Onsite support record updated successfully",
  );
};

export const confirmStaffAccountAction = async (formData: FormData) => {
  const staffId = formData.get("staff_id")?.toString();
  const currentUserId = formData.get("current_user_id")?.toString();

  const supabase = await createClient();

  if (!currentUserId) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "You must be logged in",
    );
  }

  if (!staffId) {
    return encodedRedirect("error", "/dashboard/staff", "Staff ID is required");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("company_id, user_type")
    .eq("id", currentUserId)
    .single();

  if (userError || !userData?.company_id) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "You must have a company to confirm staff accounts",
    );
  }

  if (userData.user_type !== "admin") {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Only administrators can confirm staff accounts",
    );
  }

  const { data: staffData, error: staffError } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", staffId)
    .eq("company_id", userData.company_id)
    .single();

  if (staffError || !staffData) {
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Staff member not found or access denied",
    );
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        email_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", staffId);

    if (updateError) {
      return encodedRedirect(
        "error",
        "/dashboard/staff",
        "Failed to update staff account status",
      );
    }

    return encodedRedirect(
      "success",
      "/dashboard/staff",
      "Staff account confirmed successfully",
    );
  } catch (error) {
    console.error("❌ Unexpected error confirming staff account:", error);
    return encodedRedirect(
      "error",
      "/dashboard/staff",
      "Unexpected error confirming staff account",
    );
  }
};

export const exportOnsiteSupportAction = async (formData: FormData) => {
  const filterType = formData.get("filter_type")?.toString() || "all";
  const startDate = formData.get("start_date")?.toString();
  const endDate = formData.get("end_date")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
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
      "/dashboard/onsite-support",
      "You must have a company to export onsite support records",
    );
  }

  // Build query based on filter
  let query = supabase
    .from("onsite_support")
    .select(
      `
      *,
      client_company_profiles(
        id,
        company_name,
        contact_person,
        contact_email
      )
    `,
    )
    .eq("company_id", userData.company_id)
    .order("work_date", { ascending: false });

  // Apply filters based on filter type
  if (filterType === "current") {
    // Use the provided start and end dates for current filter
    if (startDate && endDate) {
      query = query.gte("work_date", startDate).lte("work_date", endDate);
    }
  } else if (filterType === "date_range") {
    if (!startDate || !endDate) {
      return encodedRedirect(
        "error",
        "/dashboard/onsite-support",
        "Start date and end date are required for date range filter",
      );
    }
    query = query.gte("work_date", startDate).lte("work_date", endDate);
  } else if (filterType === "month") {
    if (!startDate) {
      return encodedRedirect(
        "error",
        "/dashboard/onsite-support",
        "Start date is required for month filter",
      );
    }
    // Use start date to determine month
    const monthStart = startDate.substring(0, 7) + "-01";
    const monthEnd = new Date(
      new Date(monthStart).getFullYear(),
      new Date(monthStart).getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0];
    query = query.gte("work_date", monthStart).lte("work_date", monthEnd);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("Error fetching records for export:", error);
    return encodedRedirect(
      "error",
      "/dashboard/onsite-support",
      "Failed to fetch records for export",
    );
  }

  const recordCount = records?.length || 0;
  let filterText = "";

  if (filterType === "current" && startDate && endDate) {
    filterText = ` (${startDate} to ${endDate})`;
  } else if (filterType === "date_range" && startDate && endDate) {
    filterText = ` (${startDate} to ${endDate})`;
  } else if (filterType === "month" && startDate) {
    filterText = ` (${startDate.substring(0, 7)})`;
  } else if (filterType === "all") {
    filterText = " (All Records)";
  }

  // Store the records in URL params to display them
  const recordsParam = encodeURIComponent(JSON.stringify(records || []));
  const redirectUrl = `/dashboard/onsite-support?export_results=${recordsParam}&filter_text=${encodeURIComponent(filterText)}&record_count=${recordCount}`;

  return redirect(redirectUrl);
};

export const exportClientOnsiteSupportAction = async (formData: FormData) => {
  const filterType = formData.get("filter_type")?.toString() || "all";
  const startDate = formData.get("start_date")?.toString();
  const endDate = formData.get("end_date")?.toString();
  const clientId = formData.get("client_id")?.toString();
  const sessionToken = formData.get("session_token")?.toString();
  const supabase = await createClient();

  if (!clientId) {
    const redirectUrl = sessionToken
      ? `/client-portal?session=${encodeURIComponent(sessionToken)}`
      : "/client-portal";
    return encodedRedirect("error", redirectUrl, "Client ID is required");
  }

  // Get client data to verify and get company_id
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("company_id, username, full_name, email")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !clientData) {
    const redirectUrl = sessionToken
      ? `/client-portal?session=${encodeURIComponent(sessionToken)}`
      : "/client-portal";
    return encodedRedirect("error", redirectUrl, "Invalid client credentials");
  }

  // Get client's company profile ID
  const { data: clientCredential } = await supabase
    .from("client_credentials")
    .select("client_company_profile_id")
    .eq("id", clientId)
    .single();

  if (!clientCredential?.client_company_profile_id) {
    const baseUrl = `/client-portal/onsite-support?client_id=${clientId}`;
    const redirectUrl = sessionToken
      ? `${baseUrl}&session=${encodeURIComponent(sessionToken)}`
      : baseUrl;
    return encodedRedirect(
      "error",
      redirectUrl,
      "No company profile associated with this client",
    );
  }

  // Build query based on filter - only get records for this client
  let query = supabase
    .from("onsite_support")
    .select(
      `
      *,
      client_company_profiles(
        id,
        company_name,
        contact_person,
        contact_email
      )
    `,
    )
    .eq("company_id", clientData.company_id)
    .eq("client_company_profile_id", clientId)
    .order("work_date", { ascending: false });

  // Apply filters only if filterType is not "all"
  if (filterType === "date_range") {
    if (!startDate || !endDate) {
      const baseUrl = `/client-portal/onsite-support?client_id=${clientId}`;
      const redirectUrl = sessionToken
        ? `${baseUrl}&session=${encodeURIComponent(sessionToken)}`
        : baseUrl;
      return encodedRedirect(
        "error",
        redirectUrl,
        "Start date and end date are required for date range filter",
      );
    }
    query = query.gte("work_date", startDate).lte("work_date", endDate);
  } else if (filterType === "month") {
    if (!startDate) {
      const baseUrl = `/client-portal/onsite-support?client_id=${clientId}`;
      const redirectUrl = sessionToken
        ? `${baseUrl}&session=${encodeURIComponent(sessionToken)}`
        : baseUrl;
      return encodedRedirect(
        "error",
        redirectUrl,
        "Start date is required for month filter",
      );
    }
    console.log(
      "Filter type:",
      filterType,
      "Start:",
      startDate,
      "End:",
      endDate,
    );
    // Use start date to determine month
    const monthStart = startDate.substring(0, 7) + "-01";
    const monthEnd = new Date(
      new Date(monthStart).getFullYear(),
      new Date(monthStart).getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0];
    query = query.gte("work_date", monthStart).lte("work_date", monthEnd);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("Error fetching records for export:", error);
    const baseUrl = `/client-portal/onsite-support?client_id=${clientId}`;
    const redirectUrl = sessionToken
      ? `${baseUrl}&session=${encodeURIComponent(sessionToken)}`
      : baseUrl;
    return encodedRedirect(
      "error",
      redirectUrl,
      "Failed to fetch records for export",
    );
  }

  const recordCount = records?.length || 0;
  let filterText = "";

  if (filterType === "date_range" && startDate && endDate) {
    filterText = ` (${startDate} to ${endDate})`;
  } else if (filterType === "month" && startDate) {
    filterText = ` (${startDate.substring(0, 7)})`;
  } else if (filterType === "all") {
    filterText = " (All Records)";
  }

  // Store the records in URL params to display them
  const recordsParam = encodeURIComponent(JSON.stringify(records || []));
  const baseUrl = `/client-portal/onsite-support?client_id=${clientId}&export_results=${recordsParam}&filter_text=${encodeURIComponent(filterText)}&record_count=${recordCount}`;
  const redirectUrl = sessionToken
    ? `${baseUrl}&session=${encodeURIComponent(sessionToken)}`
    : baseUrl;

  return redirect(redirectUrl);
};

// Equipment Actions
export const createEquipmentAction = async (formData: FormData) => {
  const deviceName = formData.get("device_name")?.toString()?.trim();
  const deviceType = formData.get("device_type")?.toString()?.trim();
  const deviceIpAddress = formData.get("device_ip_address")?.toString()?.trim();
  const deviceUrl = formData.get("device_url")?.toString()?.trim();
  const loginUsername = formData.get("login_username")?.toString()?.trim();
  const loginPassword = formData.get("login_password")?.toString();
  const encryptedPassword =
    loginPassword && loginPassword !== "" ? encrypt(loginPassword) : null;

  const decryptedPassword = encryptedPassword
    ? decrypt(encryptedPassword)
    : null;
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString()
    ?.trim();
  const status = formData.get("status")?.toString()?.trim() || "active";
  const location = formData.get("location")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!deviceName) {
    return encodedRedirect(
      "error",
      "/dashboard/equipment/new",
      "Device name is required",
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
      "/dashboard/equipment",
      "You must have a company to create equipment records",
    );
  }

  // Verify client company profile exists if selected
  if (clientCompanyProfileId && clientCompanyProfileId !== "unassigned") {
    const { data: profileData, error: profileError } = await supabase
      .from("client_company_profiles")
      .select("id")
      .eq("id", clientCompanyProfileId)
      .single();

    if (profileError || !profileData) {
      return encodedRedirect(
        "error",
        "/dashboard/equipment",
        "Invalid client company selection",
      );
    }
  }

  const { error } = await supabase.from("equipment_inventory").insert({
    device_name: deviceName,
    device_type: deviceType || null,
    device_ip_address: deviceIpAddress || null,
    device_url: deviceUrl || null,
    login_username: loginUsername || null,
    login_password: encryptedPassword,
    client_company_profile_id:
      clientCompanyProfileId && clientCompanyProfileId !== "unassigned"
        ? clientCompanyProfileId
        : null,
    status: status,
    location: location || null,
    description: description || null,
    company_id: userData.company_id,
  });

  if (error) {
    console.error("Error creating equipment:", error);
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Failed to create equipment record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/equipment",
    "Equipment created successfully",
  );
};

export const updateEquipmentAction = async (formData: FormData) => {
  const equipmentId = formData.get("equipment_id")?.toString()?.trim();
  const deviceName = formData.get("device_name")?.toString()?.trim();
  const deviceType = formData.get("device_type")?.toString()?.trim();
  const deviceIpAddress = formData.get("device_ip_address")?.toString()?.trim();
  const deviceUrl = formData.get("device_url")?.toString()?.trim();
  const loginUsername = formData.get("login_username")?.toString()?.trim();
  const loginPassword = formData.get("login_password")?.toString();
  let encryptedPassword;
  let decryptedPassword;
  try {
    encryptedPassword =
      loginPassword && loginPassword !== ""
        ? encrypt(loginPassword)
        : undefined;

    decryptedPassword = encryptedPassword ? decrypt(encryptedPassword) : null;

    console.log("🔒 Encrypted Password:", encryptedPassword);
    console.log("🔓 Decrypted Password:", decryptedPassword);
  } catch (e) {
    console.error("Encryption/Decryption error:", e);
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Encryption failed",
    );
  }
  const clientCompanyProfileId = formData
    .get("client_company_profile_id")
    ?.toString()
    ?.trim();
  const status = formData.get("status")?.toString()?.trim() || "active";
  const location = formData.get("location")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!equipmentId || !deviceName) {
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Equipment ID and device name are required",
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
      "/dashboard/equipment",
      "You must have a company to update equipment records",
    );
  }

  // Verify equipment belongs to user's company
  const { data: equipmentData, error: equipmentError } = await supabase
    .from("equipment_inventory")
    .select("id")
    .eq("id", equipmentId)
    .eq("company_id", userData.company_id)
    .single();

  if (equipmentError || !equipmentData) {
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Equipment not found or access denied",
    );
  }

  // Verify client company profile exists if selected
  if (clientCompanyProfileId && clientCompanyProfileId !== "unassigned") {
    const { data: profileData, error: profileError } = await supabase
      .from("client_company_profiles")
      .select("id")
      .eq("id", clientCompanyProfileId)
      .single();

    if (profileError || !profileData) {
      return encodedRedirect(
        "error",
        "/dashboard/equipment",
        "Invalid client company selection",
      );
    }
  }

  const { error } = await supabase
    .from("equipment_inventory")
    .update({
      device_name: deviceName,
      device_type: deviceType || null,
      device_ip_address: deviceIpAddress || null,
      device_url: deviceUrl || null,
      login_username: loginUsername || null,
      login_password: encryptedPassword,
      client_company_profile_id:
        clientCompanyProfileId && clientCompanyProfileId !== "unassigned"
          ? clientCompanyProfileId
          : null,
      status: status,
      location: location || null,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", equipmentId);

  if (error) {
    console.error("Error updating equipment:", error);
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Failed to update equipment record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/equipment",
    "Equipment updated successfully",
  );
};

export const deleteEquipmentAction = async (formData: FormData) => {
  const equipmentId = formData.get("equipment_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
  }

  if (!equipmentId) {
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Equipment ID is required",
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
      "/dashboard/equipment",
      "You must have a company to delete equipment records",
    );
  }

  // Verify equipment belongs to user's company
  const { data: equipmentData, error: equipmentError } = await supabase
    .from("equipment_inventory")
    .select("id")
    .eq("id", equipmentId)
    .eq("company_id", userData.company_id)
    .single();

  if (equipmentError || !equipmentData) {
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Equipment not found or access denied",
    );
  }

  // Delete the equipment
  const { error } = await supabase
    .from("equipment_inventory")
    .delete()
    .eq("id", equipmentId);

  if (error) {
    console.error("Error deleting equipment:", error);
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Failed to delete equipment record",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/equipment",
    "Equipment deleted successfully",
  );
};

export const exportEquipmentAction = async (formData: FormData) => {
  const filterType = formData.get("filter_type")?.toString() || "all";
  const filterValue = formData.get("filter_value")?.toString();
  const includeCredentials =
    formData.get("include_credentials")?.toString() === "true";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/dashboard", "You must be logged in");
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
      "/dashboard/equipment",
      "You must have a company to export equipment records",
    );
  }

  // Build query based on filter
  let query = supabase
    .from("equipment_inventory")
    .select(
      `
      *,
      client_company_profiles(
        id,
        company_name
      )
    `,
    )
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filterType === "status" && filterValue) {
    query = query.eq("status", filterValue.toLowerCase());
  } else if (filterType === "type" && filterValue) {
    query = query.ilike("device_type", `%${filterValue}%`);
  } else if (filterType === "client" && filterValue) {
    // This is more complex - we need to filter by client company name
    const { data: clientCompanyData } = await supabase
      .from("client_company_profiles")
      .select("id")
      .ilike("company_name", `%${filterValue}%`);

    if (clientCompanyData && clientCompanyData.length > 0) {
      const clientCompanyIds = clientCompanyData.map((c) => c.id);
      query = query.in("client_company_profile_id", clientCompanyIds);
    } else {
      // No matching client companies found, return empty result
      query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Non-existent ID
    }
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("Error fetching records for export:", error);
    return encodedRedirect(
      "error",
      "/dashboard/equipment",
      "Failed to fetch records for export",
    );
  }

  // Decrypt passwords for export if credentials are included
  const processedRecords = records?.map((record) => ({
    ...record,
    login_password:
      record.login_password && includeCredentials
        ? decrypt(record.login_password)
        : record.login_password,
  }));

  const recordCount = processedRecords?.length || 0;
  let filterText = "";

  if (filterType === "status" && filterValue) {
    filterText = ` (Status: ${filterValue})`;
  } else if (filterType === "type" && filterValue) {
    filterText = ` (Type: ${filterValue})`;
  } else if (filterType === "client" && filterValue) {
    filterText = ` (Client: ${filterValue})`;
  } else if (filterType === "all") {
    filterText = " (All Equipment)";
  }

  // Store the records in URL params to display them
  const recordsParam = encodeURIComponent(
    JSON.stringify(processedRecords || []),
  );
  const redirectUrl = `/dashboard/equipment?export_results=${recordsParam}&filter_text=${encodeURIComponent(filterText)}&record_count=${recordCount}&include_credentials=${includeCredentials}`;

  return redirect(redirectUrl);
};

export const exportClientEquipmentAction = async (formData: FormData) => {
  const filterType = formData.get("filter_type")?.toString() || "all";
  const filterValue = formData.get("filter_value")?.toString();
  const clientId = formData.get("client_id")?.toString();
  const supabase = await createClient();

  if (!clientId) {
    return encodedRedirect("error", "/client-portal", "Client ID is required");
  }

  // Get client data to verify and get company_id
  const { data: clientData, error: clientError } = await supabase
    .from("client_credentials")
    .select("company_id, username, full_name, email")
    .eq("id", clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !clientData) {
    return encodedRedirect(
      "error",
      "/client-portal",
      "Invalid client credentials",
    );
  }

  // Get client's company profile ID
  const { data: clientCredential } = await supabase
    .from("client_credentials")
    .select("client_company_profile_id")
    .eq("id", clientId)
    .single();

  if (!clientCredential?.client_company_profile_id) {
    return encodedRedirect(
      "error",
      `/client-portal/equipment?client_id=${clientId}`,
      "No company profile associated with this client",
    );
  }

  // Build query based on filter - only get records for this client's company
  let query = supabase
    .from("equipment_inventory")
    .select("*")
    .eq("company_id", clientData.company_id)
    .eq("client_company_profile_id", clientCredential.client_company_profile_id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filterType === "status" && filterValue) {
    query = query.eq("status", filterValue.toLowerCase());
  } else if (filterType === "type" && filterValue) {
    query = query.ilike("device_type", `%${filterValue}%`);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("Error fetching records for export:", error);
    return encodedRedirect(
      "error",
      `/client-portal/equipment?client_id=${clientId}`,
      "Failed to fetch records for export",
    );
  }

  const recordCount = records?.length || 0;
  let filterText = "";

  if (filterType === "status" && filterValue) {
    filterText = ` (Status: ${filterValue})`;
  } else if (filterType === "type" && filterValue) {
    filterText = ` (Type: ${filterValue})`;
  } else if (filterType === "all") {
    filterText = " (All Equipment)";
  }

  // Store the records in URL params to display them
  const recordsParam = encodeURIComponent(JSON.stringify(records || []));
  const redirectUrl = `/client-portal/equipment?client_id=${clientId}&export_results=${recordsParam}&filter_text=${encodeURIComponent(filterText)}&record_count=${recordCount}`;

  return redirect(redirectUrl);
};
