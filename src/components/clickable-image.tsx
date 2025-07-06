"use client";

import { openImageViewer } from "@/components/image-viewer-wrapper";

interface ClickableImageProps {
  src: string;
  alt: string;
  className?: string;
  fileName?: string;
}

export function ClickableImage({
  src,
  alt,
  className,
  fileName,
}: ClickableImageProps) {
  const handleClick = () => {
    console.log("Image clicked:", src, fileName || alt);
    openImageViewer(src, fileName || alt);
  };

  return (
    <img src={src} alt={alt} className={className} onClick={handleClick} />
  );
}
