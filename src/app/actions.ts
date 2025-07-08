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