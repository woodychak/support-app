"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { JobDetailsModal } from "./JobDetailsModal";

export default function ClientOnsiteSupportTable({ records }: { records: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<string>("");

  const openModal = (details: string) => {
    setSelectedDetails(details);
    setModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-900">Date</th>
              <th className="text-left p-3 font-medium text-gray-900">Engineer</th>
              <th className="text-left p-3 font-medium text-gray-900">Check In</th>
              <th className="text-left p-3 font-medium text-gray-900">Check Out</th>
              <th className="text-left p-3 font-medium text-gray-900">Total Hours</th>
              <th className="text-left p-3 font-medium text-gray-900">Job Details</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    {new Date(record.work_date).toLocaleDateString("en-US")}
                  </div>
                </td>
                <td className="p-3 text-sm font-medium">{record.engineer_name}</td>
                <td className="p-3 text-sm">
                  {record.check_in_time ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-green-600" />
                      {record.check_in_time}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-sm">
                  {record.check_out_time ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-red-600" />
                      {record.check_out_time}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-sm">
                  {record.totalHours ? `${record.totalHours}h` : "-"}
                </td>
                <td className="p-3 max-w-xs text-sm">
                  {record.job_details ? (
                    <button
                      onClick={() => openModal(record.job_details)}
                      className="text-blue-600 underline hover:text-blue-800 truncate"
                      title="Click to view full job details"
                    >
                      {record.job_details.slice(0, 30)}...
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <JobDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        jobDetails={selectedDetails}
      />
    </>
  );
}