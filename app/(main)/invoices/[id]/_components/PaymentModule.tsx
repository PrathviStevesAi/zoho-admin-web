"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  isUpdating: boolean;
  onUpdate: () => void;
  onCancel: () => void;
}

export function PaymentModule({
  formData,
  setFormData,
  isUpdating,
  onUpdate,
  onCancel
}: PaymentModuleProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white max-w-4xl mx-auto">
        <CardContent className="p-0">
          <div className="px-6 pt-2 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Update Payment Status</h2>
              <p className="text-slate-800 text-sm">Update payment details and set reminders for this invoice.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] text-slate-700 font-semibold">Payment Status</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, payment_status: value }))}
                >
                  <SelectTrigger className="w-full !h-11 bg-white border-slate-200 focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg px-3 transition-all">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl z-[100]">
                    <SelectItem value="pending" className="py-2.5 cursor-pointer text-sm">Pending</SelectItem>
                    <SelectItem value="paid" className="py-2.5 cursor-pointer text-sm">Paid</SelectItem>
                    <SelectItem value="unpaid" className="py-2.5 cursor-pointer text-sm">Unpaid</SelectItem>
                    <SelectItem value="net_term_client" className="py-2.5 cursor-pointer text-sm">Net Term Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_date" className="text-[13px] text-slate-700 font-semibold">Send reminder to check the payment status on this date</Label>
                <Input
                  id="reminder_date"
                  type="date"
                  min={today}
                  value={formData.reminder_date}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, reminder_date: e.target.value }))}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg px-3 text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="per_hour_rate" className="text-[13px] text-slate-700 font-semibold">Per Hour rate paid by the customer</Label>
                <div className="relative group">
                  <Input
                    id="per_hour_rate"
                    type="number"
                    min="0"
                    disabled={!!formData.per_shift_rate && formData.per_shift_rate > 0}
                    value={formData.per_hour_rate || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, per_hour_rate: Math.max(0, Number(e.target.value)) }))}
                    placeholder="0.00"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg pl-3 pr-14 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="h-5 w-px bg-slate-200 mr-2" />
                    <span className="text-slate-700 text-[11px] font-bold tracking-wider">USD</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="per_shift_rate" className="text-[13px] text-slate-700 font-semibold">Per shift ( flat ) rate paid by the customer</Label>
                <div className="relative group">
                  <Input
                    id="per_shift_rate"
                    type="number"
                    min="0"
                    disabled={!!formData.per_hour_rate && formData.per_hour_rate > 0}
                    value={formData.per_shift_rate || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, per_shift_rate: Math.max(0, Number(e.target.value)) }))}
                    placeholder="0.00"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/10 focus:border-[#0064cb] rounded-lg pl-3 pr-14 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="h-5 w-px bg-slate-200 mr-2" />
                    <span className="text-slate-700 text-[11px] font-bold tracking-wider">USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 h-10 rounded-lg font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={onUpdate}
              disabled={isUpdating}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-8 h-10 rounded-lg font-bold shadow-md shadow-[#0064cb]/10 transition-all min-w-[120px] cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
