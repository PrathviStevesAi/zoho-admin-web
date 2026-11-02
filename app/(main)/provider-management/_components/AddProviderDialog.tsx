"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface AddProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "fastguard" | "agency" | "agent";
  onSuccess?: () => void;
}

export function AddProviderDialog({ isOpen, onClose, type, onSuccess }: AddProviderDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = type === "agent" ? "Add New Agent" : type === "agency" ? "Add New Agency" : "Add Provider";
  const typeLabel = type === "agent" ? "Agent" : type === "agency" ? "Agency" : "Provider";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`${typeLabel} "${name}" profile created successfully`);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create provider profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0064cb] flex items-center justify-center shrink-0 border border-blue-100">
            {type === "agency" ? (
              <Building2 className="w-5 h-5 text-purple-600" />
            ) : type === "agent" ? (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#0064cb]" />
            )}
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Enter {typeLabel.toLowerCase()} profile details below.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              {typeLabel} Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder={`e.g. ${type === "agency" ? "Metro Protection Services" : type === "agent" ? "Michael Johnson" : "FastGuard"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="e.g. contact@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
            <Input
              placeholder="e.g. +1 480 555 1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Address / Location</Label>
            <Input
              placeholder="e.g. Los Angeles, CA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
            />
          </div>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 text-xs font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl shadow-md shadow-blue-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Save {typeLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
