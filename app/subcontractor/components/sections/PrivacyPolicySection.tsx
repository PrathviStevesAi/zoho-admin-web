"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormValues } from "../SubcontractorForm";

export function PrivacyPolicySection() {
  const { control, formState: { errors } } = useFormContext<FormValues>();

  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800">Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <p className="text-sm text-slate-700">By clicking the checkbox below, you agree to the terms of our privacy policy.</p>
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="text-sm text-blue-600 hover:underline cursor-pointer text-left w-fit block focus:outline-none">
              Click here to read our Privacy Policy
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fast Guard Service - Candidate Privacy Notice</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 mt-2">
              <p>Fast Guard Service is committed to respecting your online privacy and recognize your need for appropriate protection and management of any personally identifiable information ("Personal Information") you share with us.</p>

              <p>Fast Guard Service is a "data controller". This means that we are responsible for deciding how we hold and use personal information about you. This privacy notice makes you aware of how and why your personal data will be used, namely for the purposes of the Fast Guard Service employment recruitment process, and how long it will usually be retained for. It provides you with certain information that must be provided under the General Data Protection Regulation ((EU) 2016/679).</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data protection principles</h3>
              <p>We will comply with data protection law and principles, which means that your data will be:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Used lawfully, fairly and in a transparent way.</li>
                <li>Collected only for valid purposes that we have clearly explained to you and not used in any way that is incompatible with those purposes.</li>
                <li>Relevant to the purposes we have told you about and limited only to those purposes.</li>
                <li>Accurate and kept up to date.</li>
                <li>Kept only as long as necessary for the purposes we have told you about.</li>
                <li>Kept securely.</li>
              </ul>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">The kind of information we hold about you</h3>
              <p>In connection with your application for work with us, we will collect, store, and use the following categories of personal information about you:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The information you have provided to us in your curriculum vitae and cover letter.</li>
                <li>The information you have provided on our application form, including name, title, address, telephone number, personal email address, employment history, qualifications.</li>
                <li>Any information you provide to us during an interview.</li>
              </ul>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">How is your personal information collected?</h3>
              <p>We collect personal information about candidates from the following sources:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You, the candidate.</li>
                <li>Recruitment agencies and vendors we have agreed terms in place with</li>
                <li>Professional networking profile</li>
                <li>Employees and others who refer you to us</li>
              </ul>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">How we will use information about you?</h3>
              <p>We will use the personal information we collect about you to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Assess your skills, qualifications, and suitability for the role.</li>
                <li>Carry out background and reference checks, where applicable.</li>
                <li>Communicate with you about the recruitment process.</li>
                <li>Keep records related to our hiring processes.</li>
                <li>Comply with legal or regulatory requirements.</li>
              </ul>
              <p>We also need to process your personal information to decide whether to enter into a contract of employment with you.</p>
              <p>Having received your CV, cover letter and/or your application form, we will then process that information to decide whether you meet the basic requirements to be screened by our in-house recruitment team for the role. If you do, we will decide whether your application is strong enough to invite you for an interview, be it by telephone, in person or other electronic means. If we decide to engage you for an interview, we will use the information you provide to us at the interview to decide whether to offer you the role. If we decide to offer you the role, we will then take up references before confirming your appointment.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">If you fail to provide personal information</h3>
              <p>If you fail to provide information when requested, which is necessary for us to consider your application (such as evidence of qualifications or work history), we will not be able to process your application successfully and we will not be able to take your application further.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Automated decision-making</h3>
              <p>You will not be subject to decisions that will have a significant impact on you based solely on automated decision-making.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data sharing With third parties</h3>
              <p>We will only share your personal information with the following third parties for the purposes of processing your application; this may involve sharing your information with other companies within our ownership group, if we consider they may have other relevant vacancies and only if you consent to such sharing.</p>
              <p>All our third-party service providers and other entities in the group are required to take appropriate security measures to protect your personal information in line with our policies. We do not allow our third-party service providers to use your personal data for their own purposes. We only permit them to process your personal data for specified purposes and in accordance with our instructions.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data security</h3>
              <p>We have put in place appropriate security measures to prevent your personal information from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal information to those employees, agents, contractors and other third parties who have a business need-to-know. They will only process your personal information on our instructions and they are subject to a duty of confidentiality.</p>
              <p>We have put in place procedures to deal with any suspected data security breach and will notify you and any applicable regulator of a suspected breach where we are legally required to do so.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data retention (how long will you use my information for)</h3>
              <p>We will retain your personal information for a period of X years after we have communicated to you our decision about whether to appoint you to the role. We will retain your personal information so that we can make you aware of any suitable alternative roles that arise during this period.</p>
              <p>We further retain your personal information for that period so that we can show, in the event of a legal claim, that we have not discriminated against candidates on prohibited grounds and that we have conducted the recruitment exercise in a fair and transparent way. After this period, we will securely destroy your personal information in accordance with applicable laws and regulations.</p>
              <p>If you would prefer that we did not retain your personal information, you can notify us at any time and we will delete your personal information.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Rights of access, correction, erasure, and restriction</h3>
              <p>Under certain circumstances, by law you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Request access to your personal information (commonly known as a "data subject access request"). This enables you to receive a copy of the personal information we hold about you and to check that we are lawfully processing it.</li>
                <li>Request correction of the personal information that we hold about you. This enables you to have any incomplete or inaccurate information we hold about you corrected.</li>
                <li>Request erasure of your personal information. This enables you to ask us to delete or remove personal information where there is no good reason for us continuing to process it. You also have the right to ask us to delete or remove your personal information where you have exercised your right to object to processing (see below).</li>
                <li>Object to processing of your personal information where we are relying on a legitimate interest (or those of a third party) and there is something about your particular situation which makes you want to object to processing on this ground. You also have the right to object where we are processing your personal information for direct marketing purposes.</li>
                <li>Request the restriction of processing of your personal information. This enables you to ask us to suspend the processing of personal information about you, for example if you want us to establish its accuracy or the reason for processing it.</li>
              </ul>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Right to withdraw consent</h3>
              <p>When you applied for this role, you provided consent to us processing your personal information for the purposes of the recruitment exercise. You have the right to withdraw your consent for processing for that purpose at any time.</p>
              <p>To withdraw your consent, please contact the Recruitment Manager. Once we have received notification that you have withdrawn your consent, we will no longer process your application and, subject to our policies, we will dispose of your personal data securely.</p>

              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-6">Data protection officer</h3>
              <p>We have appointed a data protection officer (DPO) to oversee compliance with this privacy notice. If you have any questions about this privacy notice or how we handle your personal information, please contact the DPO by email, at privacy@FastGuardService.com.</p>
              <p>You have the right to make a complaint at any time to the Information Commissioner's Office (ICO), the UK supervisory authority for data protection issues.</p>
            </div>
            <div className="mt-6 flex justify-end sticky bottom-0 bg-background/95 backdrop-blur pt-2 pb-2">
              <DialogClose asChild>
                <Button type="button" className="px-8">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-start space-x-2">
          <Controller
            control={control}
            name="privacyAccepted"
            render={({ field }) => (
              <Checkbox
                id="privacyAccepted"
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
            )}
          />
          <div className="space-y-1">
            <Label htmlFor="privacyAccepted" className="text-sm font-normal text-red-500">I have read the terms of the privacy policy and consent to the processing of my information</Label>
            {errors.privacyAccepted && <p className="text-xs text-red-500">{errors.privacyAccepted.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
