"use client";

import { useState } from "react";
import { Calendar, RefreshCcw, XCircle, Clock, Star, Edit2, Plus, Zap, Paperclip, CheckSquare, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvoiceDetailsPage() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "US Soccer 5",
    description: "1 unarmed guard, 7 days per week, May 1-31, 2026, 8pm to 1am"
  });

  const handleSave = () => {
    setIsEditOpen(false);
  };

  return (
    <div className="p-4 md:p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          US Soccer 5 <span className="text-slate-800">[INV-907123]</span>
        </h1>

        <div className="flex items-center gap-12 self-center md:self-auto">
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-sky-500 flex items-center justify-center text-sky-500 group-hover:bg-sky-50 transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 uppercase">Schedule</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-50 transition-colors">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 uppercase text-center leading-tight">Update<br />Payment<br />Status</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-700">#47892</span>
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-sky-500" />
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                <a href="#" className="text-sky-500 text-sm hover:underline block">
                  Location - 9501 Sheridan St, Hollywood, FL, 33024
                </a>
              </div>

              <div className="border-t border-slate-100">
                <div className="grid grid-cols-3 p-4 items-center">
                  <span className="text-sm font-semibold text-slate-600">Workflow:</span>
                  <span className="col-span-2 text-sm text-slate-800">Service Project</span>
                </div>
                <div className="grid grid-cols-3 p-4 items-center border-t border-slate-100 bg-slate-50/50">
                  <span className="text-sm font-semibold text-slate-600">Name:</span>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm text-slate-800">{formData.title} [INV-907123]</span>
                    <Edit2
                      className="w-4 h-4 text-sky-500 cursor-pointer hover:text-sky-600 transition-colors"
                      onClick={() => setIsEditOpen(true)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-sm text-slate-800">
                <p>1 unarmed guard</p>
                <p>7 days per week</p>
                <p>May 1-31,2026</p>
                <p className="mt-4">8pm to 1am</p>

                <div className="mt-6 space-y-2">
                  <p className="font-semibold text-slate-600">Duties:</p>
                  <p className="leading-relaxed">
                    The assigned security guard will provide a visible and active security presence throughout the duration of the shift. Duties include monitoring the concession stand area and conducting regular patrols of the...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm relative">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-slate-700 mb-6">History of changes</h2>
              <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[1px] before:bg-slate-200">
                <div className="relative pl-8">
                  <div className="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full bg-sky-100 border border-sky-200" />
                  <div className="bg-sky-50/50 p-4 rounded-sm border border-sky-100">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-medium text-slate-700">New Project</h3>
                      <span className="text-xs text-slate-700">04/29/2026 14:56</span>
                    </div>
                    <p className="text-sm text-slate-800">Assigned to: Staci Gullett</p>
                  </div>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full bg-white border-2 border-red-500" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-slate-700">New</h3>
                      <span className="text-xs text-slate-700">04/29/2026 14:56</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-800">Performed by: <span className="text-slate-700">Illia Shulga</span></p>
                      <Button variant="outline" size="sm" className="h-8 gap-2 text-sky-500 border-sky-200 hover:bg-sky-50 hover:text-sky-600">
                        Edit
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-slate-800 font-medium">Customer:</p>
                        <div className="p-4 border border-slate-200 rounded-sm bg-white min-h-[100px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sky-500" />
                            <span className="text-sm text-sky-500">US Soccer 5</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-slate-800">
                          <span className="font-bold text-slate-700">Invoice/Estimate Number:</span> INV-907123
                        </p>
                        <p className="text-sm text-slate-800">
                          <span className="font-bold text-slate-700">Invoice Amount:</span> 8622
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setIsEditOpen(false)}
          />
          <Card className="relative w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Edit Details</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-700"
                onClick={() => setIsEditOpen(false)}
              >
                <X className="w-4 h-4 cursor-pointer" />
              </Button>
            </div>

            <CardContent className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-800 tracking-wider">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title..."
                  className="bg-slate-50/50 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-800 tracking-wider">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description..."
                  className="w-full rounded-sm border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="px-6 h-9 bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
