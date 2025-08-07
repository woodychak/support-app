"use server";

import { createClient } from "../../supabase/server";
import { NextResponse } from "next/server";

export const downloadAdminOnsiteExcelAction = async (formData: FormData) => {
  const filterType = formData.get("filter_type")?.toString() || "all";
  const startDate = formData.get("start_date")?.toString();
  const endDate = formData.get("end_date")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's company
  const { data: userData } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userData?.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  // Build query for records
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

  // Apply date filters
  if (filterType === "current" && startDate && endDate) {
    query = query.gte("work_date", startDate).lte("work_date", endDate);
  } else if (filterType === "date_range" && startDate && endDate) {
    query = query.gte("work_date", startDate).lte("work_date", endDate);
  } else if (filterType === "month" && startDate) {
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

  const { data: records } = await query;

  if (!records || records.length === 0) {
    return NextResponse.json({ error: "No records found" }, { status: 404 });
  }

  // Generate Excel file using dynamic import
  const XLSX = await import("xlsx");

  // Calculate total hours for each record
  const recordsWithHours = records.map((record) => {
    let totalHours = null;
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`2000-01-01T${record.check_in_time}`);
      const checkOut = new Date(`2000-01-01T${record.check_out_time}`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    }
    return { ...record, totalHours };
  });

  const ws_data = [
    [
      "Engineer Name",
      "Work Date",
      "Check-in Time",
      "Check-out Time",
      "Total Hours",
      "Client Company",
      "Job Details",
    ],
  ];

  recordsWithHours.forEach((record) => {
    const clientName = record.client_company_profiles
      ? record.client_company_profiles.company_name
      : "No specific client";

    ws_data.push([
      record.engineer_name,
      new Date(record.work_date).toLocaleDateString("en-US"),
      record.check_in_time || "",
      record.check_out_time || "",
      record.totalHours || "",
      clientName,
      record.job_details || "",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Onsite Support");

  // Generate buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Create filename with current date
  const currentDate = new Date().toISOString().split("T")[0];
  const filename = `onsite-support-admin-${currentDate}.xlsx`;

  // Return the file as a download response
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
};
