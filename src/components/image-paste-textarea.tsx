"use client";

import {
  useRef,
  useState,
  useCallback,
  ChangeEvent,
  ClipboardEvent,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "../../supabase/client";
import Image from "next/image";

interface ImagePasteTextareaProps {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  ticketId: string;
  onChange?: (value: string) => void;
}

interface ImageUpload {
  file: File;
  previewUrl: string;
  uploading: boolean;
  path?: string;
  error?: string;
}

export function ImagePasteTextarea({
  id,
  name,
  placeholder,
  defaultValue,
  rows = 4,
  required = false,
  ticketId,
  onChange,
}: ImagePasteTextareaProps) {
  const [text, setText] = useState(defaultValue || "");
  const [images, setImages] = useState<ImageUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await addImage(file);
        }
      }
    }
  };

  // helper – replace spaces & unsafe characters
  const safeFileName = (name: string) =>
    name
      .trim()
      .replace(/\s+/g, "-") // spaces → dashes
      .replace(/[^\w.\-]/g, ""); // remove anything not alphanum / . / -

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    // run uploads in parallel; wait for all
    await Promise.all(Array.from(e.target.files).map((file) => addImage(file)));

    // reset <input type="file">
    e.target.value = "";
  };

  const addImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return; // guard non-images
    if (file.size > 50 * 1024 * 1024) {
      // 50 MB
      alert("Image too large (max 50 MB)");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImages((prev) => [...prev, { file, previewUrl, uploading: true }]);

    try {
      // build very safe path: ticket-<id>/<uuid>-<safeName>
      const filePath = `ticket-${ticketId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type, // 👈 explicit MIME
        });

      if (error) throw error;

      setImages((prev) =>
        prev.map((img) =>
          img.previewUrl === previewUrl
            ? { ...img, uploading: false, path: filePath }
            : img,
        ),
      );
    } catch (err) {
      console.error("Upload failed:", err);
      setImages((prev) =>
        prev.map((img) =>
          img.previewUrl === previewUrl
            ? { ...img, uploading: false, error: "Upload failed" }
            : img,
        ),
      );
    }
  };

  const removeImage = useCallback((previewUrl: string) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.previewUrl !== previewUrl);

      // Revoke the object URL to free up memory
      URL.revokeObjectURL(previewUrl);

      return updatedImages;
    });
  }, []);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={text}
        rows={rows}
        required={required}
        onChange={handleTextChange}
        onPaste={handlePaste}
        className="min-h-[100px]"
      />

      {/* Hidden file input */}
      <input
        type="hidden"
        name="attachments"
        value={images
          .filter((img) => img.path && !img.error)
          .map((img) => img.path)
          .join(",")}
      />

      {/* Image upload button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          Attach Image
        </Button>
        <span className="text-xs text-muted-foreground">
          or paste images directly
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative border rounded-md overflow-hidden group"
            >
              <div className="aspect-square relative">
                <Image
                  src={img.previewUrl}
                  alt="Uploaded image"
                  fill
                  className="object-cover"
                />
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-xs text-white bg-red-500 px-2 py-1 rounded">
                      Error
                    </span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(img.previewUrl)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
