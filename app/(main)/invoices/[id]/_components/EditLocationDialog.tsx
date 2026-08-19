"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShippingAddress } from "@/types/dashboard.types";
import { GooglePlacesAutocomplete } from "@/components/ui/GooglePlacesAutocomplete";

interface EditLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: ShippingAddress) => Promise<void>;
  initialAddress?: ShippingAddress | string;
  isSaving: boolean;
}

export function EditLocationDialog({
  isOpen,
  onClose,
  onUpdate,
  initialAddress,
  isSaving
}: EditLocationDialogProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });

  useEffect(() => {
    if (isOpen) {
      const addr = (initialAddress && typeof initialAddress === 'object') ? initialAddress : {};
      setFormData({
        street: (addr as any).street || "",
        city: (addr as any).city || "",
        state: (addr as any).state || "",
        zip: (addr as any).zip || "",
        country: (addr as any).country || ""
      });
    }
  }, [isOpen, initialAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.state || !formData.country) {
      return;
    }
    await onUpdate(formData);
  };

  const handleAddressSelect = (address: ShippingAddress) => {
    setFormData(address);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-visible border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Location</DialogTitle>
            <DialogDescription className="text-xs text-slate-800 mt-1">
              Update the shipping address details for this invoice.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Street</Label>
            <GooglePlacesAutocomplete
              value={formData.street || ""}
              required
              onChange={(value) => setFormData(prev => ({ ...prev, street: value }))}
              onAddressSelect={handleAddressSelect}
              placeholder="Enter street address"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">City</Label>
            <Input
              value={formData.city || ""}
              required
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city name"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">State</Label>
              <Input
                value={formData.state || ""}
                required
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state name"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">ZIP Code</Label>
              <Input
                value={formData.zip || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="Enter zip code"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Country</Label>
            <Input
              value={formData.country || ""}
              required
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Enter country name"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-8 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-8 rounded-xl font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
