import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActionErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function ActionErrorDialog({ isOpen, onClose, message }: ActionErrorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
        <div className="p-6 text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-red-100/50">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              Action Unsuccessful
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-2">
            <p>{message}</p>
          </div>
          <p className="text-sm text-slate-500 font-medium">Please add a another guard.</p>
          <div className="flex justify-center pt-2">
            <Button
              onClick={onClose}
              className="w-full bg-[#0064cb] hover:bg-[#0052ae] text-white h-11 rounded-xl font-bold shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95"
            >
              Okay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
