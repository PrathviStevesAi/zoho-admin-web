"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FormValues } from "../SubcontractorForm";

export function DocumentsCredentialsSection() {
  const { control, watch, setValue } = useFormContext<FormValues>();
  const [showVideoInstructions, setShowVideoInstructions] = useState(false);
  const isSecurityLicenseOptional = watch("securityLicenseOptional");
  const guardEmail = watch("email");

  return (
    <>
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800">Upload Your Resume / CV <span className="text-red-500">*</span></h3>
          <p className="text-xs text-slate-500 mt-1">Documents must be in one of the following formats: <strong>DOC, DOCX, PDF</strong> and less than <strong>5MB</strong>.</p>
        </div>
        <div className="w-full max-w-[220px]">
          <FileUpload
            label=""
            accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            maxSizeMB={5}
            onFileSelect={(file) => setValue("resume", file)}
            variant="button"
            buttonText="My computer"
            uploadType="resume"
            guardEmail={guardEmail}
          />
        </div>
      </div>

      <Card className="shadow-none border-slate-200">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm font-medium text-slate-800 mb-4">
            Documents & Credentials: (Please upload each of the documents / images & videos, max 5MB) requested below if you have the certifications. Failing to do so may delay or deny processing of your application)
          </p>

          <div className="space-y-3">
            <div className="w-full">
              <FileUpload
                label=""
                helperText=""
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={(file) => setValue("headshot_image", file)}
                variant="red-button"
                buttonText="Upload HeadShot Image<span class='text-red-500'>*</span>"
                uploadType="headshot-image"
                guardEmail={guardEmail}
              />
            </div>

            <div className="w-full">
              <FileUpload
                label=""
                helperText=""
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={(file) => setValue("security_guard_license", file)}
                variant="red-button"
                buttonText={`Upload Security Guard License${!isSecurityLicenseOptional ? "<span class='text-red-500'>*</span>" : ""}`}
                uploadType="security-guard-license-image"
                guardEmail={guardEmail}
                slotRight={
                  <div className="flex items-center space-x-2">
                    <Controller
                      control={control}
                      name="securityLicenseOptional"
                      render={({ field }) => (
                        <Checkbox id="securityLicenseOptional" checked={field.value as boolean} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="securityLicenseOptional" className="text-xs font-normal text-slate-600">Note: Mark if Security Guard License is not required in your state</Label>
                  </div>
                }
              />
            </div>

            <div className="w-full">
              <FileUpload
                label=""
                helperText=""
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={(file) => setValue("driver_license", file)}
                variant="red-button"
                buttonText="Upload Driver License<span class='text-red-500'>*</span>"
                uploadType="driver-license-image"
                guardEmail={guardEmail}
              />
            </div>

            <div className="w-full">
              <FileUpload
                label=""
                helperText=""
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={(file) => setValue("firewatch_certificate", file)}
                variant="red-button"
                buttonText="Upload Firewatch Certificate"
                isOptional={true}
                uploadType="firewatch-certificate-image"
                guardEmail={guardEmail}
              />
            </div>

            <div className="w-full">
              <FileUpload
                label=""
                helperText=""
                accept="video/*"
                maxSizeMB={15}
                onFileSelect={(file) => setValue("verificationVideo", file)}
                variant="red-button"
                buttonText="Upload Verification Video<span class='text-red-500'>*</span>"
                uploadType="verification_video"
                guardEmail={guardEmail}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowVideoInstructions(!showVideoInstructions)}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Click here to read instructions for creating your video
            </button>

            {showVideoInstructions && (
              <div className="mt-4 p-4 border border-slate-200 rounded-md bg-slate-50 text-sm">
                <p className="mb-2">Please record a front-facing video (15-30 seconds) while wearing a black button-up shirt or a black 3-button polo.</p>
                <p className="font-semibold mb-1">In the video, you MUST:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-700">
                  <li>Say your full name</li>
                  <li>Say how many years of security experience you have</li>
                  <li>Show your security license on camera and mention the license type</li>
                  <li>Make sure the video is front-facing (camera directly facing you)</li>
                  <li>Upload the video in any standard video format</li>
                  <li>The video should be less than 15MB</li>
                </ul>
                <div className="bg-green-50 p-3 rounded text-green-800 text-xs border border-green-100">
                  <strong>Note:</strong> Please upload all required documents and the verification video correctly. Do not upload unnecessary or incorrect files. If the wrong documents are uploaded, your application may be rejected.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
