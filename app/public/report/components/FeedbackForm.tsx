"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { submitPublicShiftReviewAction } from "@/actions/public-report.actions";

interface FeedbackFormProps {
  shiftId?: string;
  reportToken?: string;
  onClose: () => void;
  onRefreshStart?: () => void;
}

export function FeedbackForm({ shiftId, reportToken, onClose, onRefreshStart }: FeedbackFormProps) {
  const router = useRouter();
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceHover, setServiceHover] = useState(0);
  const [serviceFeedback, setServiceFeedback] = useState("");

  const [guardRating, setGuardRating] = useState(0);
  const [guardHover, setGuardHover] = useState(0);
  const [guardFeedback, setGuardFeedback] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (serviceRating === 0 || guardRating === 0) {
      toast.error("Please provide a rating for both service and guard");
      return;
    }

    if (!serviceFeedback.trim() || !guardFeedback.trim()) {
      toast.error("Please provide feedback for both service and guard");
      return;
    }

    if (!shiftId || !reportToken) {
      toast.error("Missing shift or report context");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitPublicShiftReviewAction(shiftId, reportToken, {
        customer_service_rating: serviceRating,
        customer_service_review: serviceFeedback,
        customer_guard_rating: guardRating,
        customer_guard_review: guardFeedback,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to submit feedback");
        return;
      }

      toast.success(result.data?.message || "Thank you for your feedback!");
      if (onRefreshStart) onRefreshStart();
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    hoverRating: number,
    setRating: (v: number) => void,
    setHover: (v: number) => void
  ) => {
    return (
      <div className="flex flex-col items-center gap-1 sm:items-end">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={cn(
                  "cursor-pointer w-8 h-8 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                )}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 pr-1">Select a rating</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rate Our Service</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  How would you rate your overall experience with Fast Guard Security Service?
                </p>
              </div>
            </div>
            {renderStars(serviceRating, serviceHover, setServiceRating, setServiceHover)}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={serviceFeedback}
              onChange={(e) => setServiceFeedback(e.target.value)}
              placeholder="Tell us about your experience with our service..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-y text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <div className="text-right text-xs text-slate-400">0 / 500</div>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rate Your Guard</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  How would you rate the performance and professionalism of your assigned guard?
                </p>
              </div>
            </div>
            {renderStars(guardRating, guardHover, setGuardRating, setGuardHover)}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={guardFeedback}
              onChange={(e) => setGuardFeedback(e.target.value)}
              placeholder="Tell us about the guard's performance..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-y text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <div className="text-right text-xs text-slate-400">0 / 500</div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-500">Your feedback helps us improve!</h4>
            <p className="text-sm text-amber-700 dark:text-amber-600 mt-1">
              Your review is important to us and helps maintain the highest standards of security services.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center mt-2 gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || serviceRating === 0 || guardRating === 0}
            className="cursor-pointer w-full sm:w-auto min-w-[200px] py-3 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Submit Review
                <Send className="cursor-pointer w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your feedback is secure and will only be used for quality improvement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
