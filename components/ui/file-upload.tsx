"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateUploadUrlAction } from "@/actions/subcontractor.actions";
import { toast } from "sonner";

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
}

export function FileUpload({
  onFileSelect,
  accept = "*",
  maxSizeMB = 5,
  label,
  helperText,
  error,
  variant = "red-button",
  buttonText = "Upload",
  isOptional = false,
  uploadType,
  guardEmail,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        if (uploadType) {
          if (!guardEmail) {
             toast.error("Please enter your Email address first before uploading documents.");
             if (inputRef.current) inputRef.current.value = "";
             return;
          }
          
          setIsUploading(true);
          setUploadProgress(0);
          
          const res = await generateUploadUrlAction(file.name, uploadType, guardEmail);
          
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
                onFileSelect(file);
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
      <div className="w-full">
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
              className={`w-full justify-start text-slate-700 bg-white hover:bg-slate-50 font-normal py-6 rounded-md shadow-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-5 w-5 mr-3 text-slate-800" />
              <span dangerouslySetInnerHTML={{ __html: buttonText }} />
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
          <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-md">
            <span className="text-sm font-medium text-green-700 truncate flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {selectedFile.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-8 px-2 text-slate-500 hover:text-red-500 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  // fallback to dragdrop if needed
  return null;
}
