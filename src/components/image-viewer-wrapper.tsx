"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageViewerModal } from "@/components/image-viewer-modal";

// Global state to ensure only one instance handles the events
let globalImageViewer: {
  setIsOpen: (open: boolean) => void;
  setImageUrl: (url: string) => void;
  setFileName: (name: string) => void;
} | null = null;

export function ImageViewerWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const handleImageClick = useCallback((event: CustomEvent) => {
    console.log("Image viewer event received:", event.detail);
    setImageUrl(event.detail.url);
    setFileName(event.detail.fileName || "Image");
    setIsOpen(true);
  }, []);

  useEffect(() => {
    // Register this instance as the global handler
    globalImageViewer = {
      setIsOpen,
      setImageUrl,
      setFileName,
    };

    console.log("ImageViewerWrapper mounted, adding event listener");
    window.addEventListener(
      "openImageViewer",
      handleImageClick as EventListener,
    );

    return () => {
      console.log("ImageViewerWrapper unmounting, removing event listener");
      window.removeEventListener(
        "openImageViewer",
        handleImageClick as EventListener,
      );
      // Clear global reference if this was the active instance
      if (globalImageViewer && globalImageViewer.setIsOpen === setIsOpen) {
        globalImageViewer = null;
      }
    };
  }, [handleImageClick]);

  return (
    <ImageViewerModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      imageUrl={imageUrl}
      fileName={fileName}
    />
  );
}

// Helper function to open image viewer
export function openImageViewer(url: string, fileName?: string) {
  console.log("openImageViewer called with:", url, fileName);

  // Try direct approach first if global instance is available
  if (globalImageViewer) {
    console.log("Using global image viewer instance");
    globalImageViewer.setImageUrl(url);
    globalImageViewer.setFileName(fileName || "Image");
    globalImageViewer.setIsOpen(true);
    return;
  }

  // Fallback to event-based approach
  console.log("Using event-based approach");
  const event = new CustomEvent("openImageViewer", {
    detail: { url, fileName },
  });
  window.dispatchEvent(event);
  console.log("Event dispatched");
}
