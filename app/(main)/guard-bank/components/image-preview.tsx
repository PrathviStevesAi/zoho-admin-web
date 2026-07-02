"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2 } from "lucide-react";

export function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadImg = async () => {
      setLoading(true);
      try {
        const urlLower = url.toLowerCase();
        const isHeic = urlLower.includes(".heic") || urlLower.includes(".heif");
        if (isHeic) {
          const res = await fetch(url);
          const blob = await res.blob();
          const heic2any = (await import("heic2any")).default;
          const convertedBlob = await heic2any({ blob, toType: "image/jpeg" });
          const objectUrl = URL.createObjectURL(
            Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          );
          if (isMounted) {
            setImgSrc(objectUrl);
          }
        } else {
          if (isMounted) {
            setImgSrc(url);
          }
        }
      } catch (error) {
        console.error("Error loading image:", error);
        if (isMounted) {
          setImgSrc(url); // fallback
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadImg();
    }

    return () => {
      isMounted = false;
      if (imgSrc && imgSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [url]);

  return (
    <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <img
            src={imgSrc || url}
            alt={alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <a
            href={imgSrc || url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-semibold gap-1 text-sm rounded-xl"
          >
            <Eye className="w-4 h-4" /> View Full
          </a>
        </>
      )}
    </div>
  );
}
