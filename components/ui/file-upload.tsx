"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateUploadUrlAction } from "@/actions/subcontractor.actions";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  error?: string;
  variant?: "dragdrop" | "button" | "red-button";
  buttonText?: string;
  isOptional?: boolean;
  uploadType?: string;
  guardEmail?: string;
  slotRight?: React.ReactNode;
}

export function FileUpload({
  onFileSelect,
  accept = "*",
  maxSizeMB = 15,
  label,
  helperText,
  error,
  variant = "red-button",
  buttonText = "Upload",
  isOptional = false,
  uploadType,
  guardEmail,
  slotRight,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    if (accept && accept !== "*") {
      const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type.toLowerCase();

      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '');
          return fileType.startsWith(baseType);
        }
        if (type.startsWith('.')) {
          return `.${fileExtension}` === type;
        }
        return fileType === type;
      });

      if (!isAccepted) {
        if (accept.includes('video')) {
          toast.error("Invalid file type. Please upload a valid video (e.g. mp4, mov, hevc, etc).");
        } else if (accept.includes('image')) {
          toast.error("Invalid file type. Please upload a valid image (e.g. jpg, png, jpeg, etc).");
        } else {
          toast.error(`Invalid file type. Please upload a valid file matching: ${accept}`);
        }
        return false;
      }
    }

    return true;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];
      if (validateFile(file)) {
        if (uploadType) {
          if (!guardEmail) {
            toast.error("Please enter your Email address first before uploading documents.");
            if (inputRef.current) inputRef.current.value = "";
            return;
          }

          setIsUploading(true);
          setUploadProgress(0);

          if (file.type.startsWith("image/")) {
            const options = {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            try {
              file = await imageCompression(file, options);
            } catch (error) {
              console.error("Error compressing image", error);
              toast.error("Failed to compress image");
              setIsUploading(false);
              if (inputRef.current) inputRef.current.value = "";
              return;
            }
          } else if (file.type.startsWith("video/")) {
            try {
              console.log(`[Compression] Before compression: Original file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
              toast.info("Compressing video... This may take a moment.");
              const ffmpeg = new FFmpeg();

              ffmpeg.on('progress', ({ progress }) => {
                const percent = Math.round(progress * 100);
                if (percent >= 0 && percent <= 100) {
                  console.log(`[Compression] Compressing... Progress: ${percent}%`);
                  setUploadProgress(percent);
                }
              });

              const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
              await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
              });

              const inputName = 'input' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
              const outputName = 'output.mp4';
              await ffmpeg.writeFile(inputName, await fetchFile(file));

              const getVideoDuration = (f: File): Promise<number> => {
                return new Promise((resolve) => {
                  const video = document.createElement("video");
                  video.preload = "metadata";
                  video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(video.duration);
                  };
                  video.src = URL.createObjectURL(f);
                });
              };

              let duration = await getVideoDuration(file);
              if (!duration || duration <= 0) duration = 1;

              // Target file size is 50% of original. 
              // Size (bits) = (file.size / 2) * 8 = file.size * 4
              // Bitrate (kbps) = (Size / duration) / 1000
              const targetBitrateKbps = Math.max(100, Math.round(((file.size * 4) / duration) / 1000));

              await ffmpeg.exec([
                '-i', inputName,
                '-vcodec', 'libx264',
                '-b:v', `${targetBitrateKbps}k`,
                '-maxrate', `${Math.round(targetBitrateKbps * 1.2)}k`,
                '-bufsize', `${targetBitrateKbps * 2}k`,
                '-preset', 'ultrafast',
                outputName
              ]);

              const data = await ffmpeg.readFile(outputName);
              file = new File([data as any], file.name.replace(/\.[^/.]+$/, "") + ".mp4", { type: 'video/mp4' });
              console.log(`[Compression] After compression: New file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

              setUploadProgress(0);
            } catch (error) {
              console.error("Error compressing video", error);
              toast.error("Failed to compress video");
              setIsUploading(false);
              if (inputRef.current) inputRef.current.value = "";
              return;
            }
          }

          const trimmedGuardEmail = guardEmail.trim();
          const res = await generateUploadUrlAction(file.name, uploadType, trimmedGuardEmail);

          if (!res.success) {
            toast.error(res.error || "Failed to generate upload URL");
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
            return;
          }

          const signedUrl = res.data.signed_url;

          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signedUrl, true);
          // Only send Content-Type if Supabase signed URLs require it, usually they don't or it relies on what was signed. We will add it.
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
              setSelectedFile(file);
              onFileSelect(res.data.file_path);
            } else {
              toast.error("Failed to upload file to storage.");
              if (inputRef.current) inputRef.current.value = "";
            }
          };

          xhr.onerror = () => {
            setIsUploading(false);
            toast.error("An error occurred during file upload.");
            if (inputRef.current) inputRef.current.value = "";
          };

          xhr.send(file);
        } else {
          setSelectedFile(file);
          onFileSelect(file);
        }
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (variant === "button") {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-semibold text-slate-800 mb-1">{label}</label>}
        {helperText && <p className="text-xs text-slate-500 mb-3">{helperText}</p>}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />

        {!selectedFile ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-normal shadow-sm w-full justify-start"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
            {isUploading && (
              <div className="mt-2 w-full flex items-center gap-2">
                <div className="flex-1 bg-green-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-green-700">{uploadProgress}%</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-green-600 truncate flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {selectedFile.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 px-2 text-slate-400 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  if (variant === "red-button") {
    return (
      <div className="w-full flex flex-col md:flex-row md:items-center gap-3">
        <div className="w-full md:w-[350px] shrink-0">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="outline"
            className={`w-full justify-start text-slate-700 bg-white hover:bg-slate-50 font-normal py-6 rounded-md shadow-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-5 w-5 mr-3 text-slate-800 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: buttonText }} className="truncate" />
          </Button>
          {isUploading && (
            <div className="mt-2 w-full flex items-center gap-2">
              <div className="flex-1 bg-green-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-green-500 h-1.5 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-green-700">{uploadProgress}%</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {(selectedFile || slotRight) && (
          <div className="flex flex-col gap-1 justify-center">
            {selectedFile && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 shrink-0" />
                  <span className="truncate max-w-[200px] xl:max-w-[300px]">{selectedFile.name}</span>
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-slate-400 hover:text-red-500 shrink-0 flex items-center justify-center p-1"
                >
                  <X className="cursor-pointer h-4 w-4" />
                </button>
              </div>
            )}
            {slotRight && (
              <div>{slotRight}</div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
}
