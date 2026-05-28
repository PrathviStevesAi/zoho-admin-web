import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GooglePlacesAutocomplete } from "@/components/ui/GooglePlacesAutocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Address } from "../types";

interface EditShiftLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation: Address;
  onSave: (address: Address) => Promise<void>;
  isSaving: boolean;
}

export function EditShiftLocationDialog({
  isOpen,
  onClose,
  initialLocation,
  onSave,
  isSaving,
}: EditShiftLocationDialogProps) {
  const [form, setForm] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        street: initialLocation.street || "",
        city: initialLocation.city || "",
        state: initialLocation.state || "",
        zip: initialLocation.zip || "",
        country: initialLocation.country || "",
      });
    }
  }, [isOpen, initialLocation]);

  const handleUpdate = () => {
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-visible border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Location</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Update the shipping address details for this shift.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Street</Label>
            <GooglePlacesAutocomplete
              value={form.street || ""}
              onChange={(value) => setForm((prev) => ({ ...prev, street: value }))}
              onAddressSelect={(address) => setForm(address)}
              placeholder="Enter street address"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">City</Label>
            <Input
              value={form.city || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city name"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">State</Label>
              <Input
                value={form.state || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state name"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">ZIP Code</Label>
              <Input
                value={form.zip || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
                placeholder="Enter zip code"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Country</Label>
            <Input
              value={form.country || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Enter country name"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-xl text-sm text-slate-800"
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
              onClick={handleUpdate}
              disabled={isSaving}
              className="h-11 px-8 rounded-xl font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
