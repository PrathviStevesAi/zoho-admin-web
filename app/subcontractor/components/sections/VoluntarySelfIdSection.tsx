"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomInput } from "../CustomInput";
import { FormValues } from "../SubcontractorForm";

export function VoluntarySelfIdSection() {
  const { register, control, formState: { errors } } = useFormContext<FormValues>();
  const [showRaceDefinitions, setShowRaceDefinitions] = useState(false);

  return (
    <>
      <Card className="shadow-none border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Voluntary Self-Identification</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <p className="text-sm text-slate-700 leading-relaxed">
            Qualified resume submissions are considered for employment without regard to race, religion, sex, national origin, marital status, sexual orientation, veteran status, or disability. Completion of this form is <strong>VOLUNTARY</strong> and your failure to complete it will <strong>NOT</strong> preclude you from employment consideration. This information will be kept in a confidential file separate from your resume.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-red-500 uppercase text-xs font-semibold">GENDER / GÉNERO*</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <button type="button" onClick={() => setShowRaceDefinitions(!showRaceDefinitions)} className="text-xs text-blue-600 hover:underline block pt-2 text-left focus:outline-none cursor-pointer">Click To View Race/Ethnicity Definitions</button>
            </div>

            <div className="space-y-2">
              <Label className="text-red-500 uppercase text-xs font-semibold">RACE/ETHNICITY / RAZA/ETNICIDAD *</Label>
              <Controller
                control={control}
                name="race"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="black">Black or African American</SelectItem>
                      <SelectItem value="hispanic-latino">Hispanic or Latino</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="native-american">American Indian or Alaska Native</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="not-disclose">I choose Not To Disclose</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <button type="button" onClick={() => setShowRaceDefinitions(!showRaceDefinitions)} className="text-xs text-blue-600 hover:underline block pt-2 text-right md:text-left focus:outline-none w-full md:w-auto cursor-pointer">Haga clic para ver la raza / origen étnico Definiciones</button>
            </div>
          </div>

          {showRaceDefinitions && (
            <div className="mt-4 border border-slate-200 rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700 overflow-hidden text-slate-700 dark:text-slate-300 text-sm animate-in fade-in duration-300">
              <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Hispanic or Latino</h4>
                  <p className="text-xs mt-1">A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin regardless of race.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">American Indian or Alaska Native (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">A person having origins in any of the original peoples of North and South America (including Central America), and who maintain tribal affiliation or community attachment.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Asian (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian Subcontinent, including Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippines, Thailand, and Vietnam.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Black or African American (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">A person having origins in any of the black racial groups of Africa.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">A person having origins in any of the peoples of Hawaii, Guam, Samoa, or other Pacific Islands.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">White (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">A person having origins in any of the original peoples of Europe, the Middle East, or North Africa.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Two or More Races (Not Hispanic or Latino)</h4>
                  <p className="text-xs mt-1">Persons who identify with two or more race/ethnicity categories named above.</p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Hispano o Latino</h4>
                  <p className="text-xs mt-1">Una persona de cultura Cubana, Mexicana, Puertorriqueña, América del Sur o Central o de otra cultura hispana u origen independiente de la raza.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Indígena Americano o Nativo de Alaska (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente original de la América del Norte y del Sur (incluyendo la América Central) y que mantenga una afiliación tribal o asociación comunitaria.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Asiático (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente del Oriente Medio, Sudeste Asiático o el Subcontinente Indio incluyendo Cambodia, China, India, Japón, Corea, Malasia, Pakistán, las Islas Filipinas, Tailandia, y Vietnam.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Negro o Americano Africano (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Una persona con su origen en cualquiera de los grupos raciales negros de África.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Nativo del Hawái o de Otras Islas del Pacífico (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Una persona con su origen en cualquiera de la gente de Hawái, Guam, Samoa, u otra Isla del Pacífico.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Blanco (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Una persona con su origen en personas de Europa, Oriente Medio o África del Norte.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Dos o más razas (No Hispano o Latino)</h4>
                  <p className="text-xs mt-1">Personas que se identifican con dos o más categorías de raza/etnicidad mencionadas arriba.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Veteran Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Controller
            control={control}
            name="veteranStatus"
            render={({ field }) => (
              <div className="space-y-3">
                {["YES I am a veteran", "NO I am not a veteran", "I choose to not disclose"].map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`vet-${opt}`}
                      name="veteranStatus"
                      value={opt}
                      checked={field.value === opt}
                      onChange={() => field.onChange(opt)}
                      className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`vet-${opt}`} className="text-red-400 font-normal">{opt}</Label>
                  </div>
                ))}
              </div>
            )}
          />
          {errors.veteranStatus && <p className="text-xs text-red-500 mt-2">{errors.veteranStatus.message}</p>}
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Disability Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Controller
            control={control}
            name="disabilityStatus"
            render={({ field }) => (
              <div className="space-y-3">
                {["YES I have a disability", "NO I do not have a disability", "I choose to not disclose"].map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`dis-${opt}`}
                      name="disabilityStatus"
                      value={opt}
                      checked={field.value === opt}
                      onChange={() => field.onChange(opt)}
                      className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`dis-${opt}`} className="text-red-400 font-normal">{opt}</Label>
                  </div>
                ))}
              </div>
            )}
          />
          {errors.disabilityStatus && <p className="text-xs text-red-500 mt-2">{errors.disabilityStatus.message}</p>}
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Candidate Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            The information that I am submitting in this application is true and correct. I understand that in the event of my employment by the Company, I shall be subject to dismissal if any information that I have given in this application is false or misleading or if I have failed to give any information herein requested, regardless of the time elapsed after discovery.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            I understand that nothing in this employment application, the granting of an interview or my subsequent employment with the Company is intended to create an employment contract between myself and the Company under which my employment could be terminated only for cause.
          </p>

          <div className="space-y-1 pt-2">
            <Label htmlFor="fullName" className="text-red-500 font-medium">Type Your Full Name Here*</Label>
            <CustomInput id="fullName" placeholder="Enter your full name" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="text-sm text-blue-600 hover:underline block pt-2 text-left w-fit focus:outline-none cursor-pointer">
            Disclaimer - On-Call Job Policy
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-800 dark:text-slate-200 border-b pb-4">Disclaimer &ndash; On-Call Job Policy</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 pt-2">
            <p className="font-semibold text-slate-900 dark:text-white">An on-call job means:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li>You are not scheduled for fixed, regular hours like a full-time or part-time employee.</li>
              <li>The company may contact you only when work is needed (for example, to cover a shift, handle an event, or fill in for someone).</li>
              <li>Work hours may be irregular and unpredictable &mdash; some weeks you may be offered several shifts, while other weeks you may not be offered any.</li>
              <li>You are expected to be available and ready on short notice, though the amount of notice depends on the employer's needs.</li>
              <li>In security work, this often includes being called for special events, emergency coverage, or last-minute posts.</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
