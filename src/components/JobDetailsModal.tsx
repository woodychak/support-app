// components/JobDetailsModal.tsx
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

export function JobDetailsModal({ isOpen, onClose, jobDetails }: { isOpen: boolean; onClose: () => void; jobDetails: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4">Job Details</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{jobDetails}</p>
      </div>
    </div>
  );
}