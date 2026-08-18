"use client";

import { useState } from "react";
import { Star, Send, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shift } from "./types";
import { cn } from "@/lib/utils";

interface ApproveShiftCardProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onApprove: (rating: number, comment: string) => Promise<void>;
  isApproving: boolean;
}

export function ApproveShiftCard({
  isOpen,
  onClose,
  shift,
  onApprove,
  isApproving,
}: ApproveShiftCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");

  if (!isOpen || !shift) return null;

  const handleSend = async () => {
    if (rating === 0) return;
    await onApprove(rating, comment);
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white mb-6 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-600">Approve the shift completion</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 bg-slate-50/30">
        <div className="w-full bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-500">Rate the quality of work on a 5-point scale</h4>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors stroke-1",
                    (hoveredRating >= star || rating >= star)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-500">Comments about guard's performance</h4>
          <textarea
            className="w-full min-h-[120px] p-3 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y placeholder:text-slate-400"
            placeholder="Comments about guard's performance"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 pt-0 flex justify-end gap-3 bg-slate-50/30">
        <div className="flex items-center justify-end gap-3 w-full pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 h-11 rounded-lg font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isApproving || rating === 0}
            className="px-6 h-11 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer border-none"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isApproving ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
