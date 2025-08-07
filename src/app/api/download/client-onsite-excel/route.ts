import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get("client_id")?.toString();
    const sessionToken = formData.get("session_token")?.toString();
    const filterType = formData.get("filter_type")?.toString() || "all";
    const startDate = formData.get("start_date")?.toString();
    const endDate = formData.get("end_date")?.toString();
    const supabase = await createClient();

    if (!clientId || !sessionToken) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 401 },
      );
    }

    // Verify session token
    const { data: sessionData, error: sessionError } = await supabase
      .from("client_sessions")
      .select("*")
      .eq("session_token", decodeURIComponent(sessionToken))
      .eq("client_id", clientId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get client data
    const { data: clientData, error: clientError } = await supabase
      .from("client_credentials")
      .select("company_id, client_company_profile_id")
      .eq("id", clientId)
      .eq("is_active", true)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: "Invalid client" }, { status: 401 });
    }

    // Build query for records
    let query = supabase
      .from("onsite_support")
      .select("*")
      .eq("company_id", clientData.company_id)
      .eq("client_company_profile_id", clientData.client_company_profile_id)
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
        "Job Details",
      ],
    ];

    recordsWithHours.forEach((record) => {
      ws_data.push([
        record.engineer_name,
        new Date(record.work_date).toLocaleDateString("en-US"),
        record.check_in_time || "",
        record.check_out_time || "",
        record.totalHours || "",
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
    const filename = `onsite-support-${currentDate}.xlsx`;

    // Return the file as a download response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 },
    );
  }
}
