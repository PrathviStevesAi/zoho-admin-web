"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, Info, RotateCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTwilioBalanceAction, TwilioBalanceData } from "@/actions/twilio.actions";

const TWILIO_BILLING_URL =
  "https://1console.twilio.com/organization/OR0f223746f83418914e6e876605d9b70d/billing/group/billing_group_0q27yvsfj1qht8z1eth3w33va0/overview";

interface SmsBalanceCardProps {
  refreshTrigger?: number;
}

export function SmsBalanceCard({ refreshTrigger }: SmsBalanceCardProps) {
  const [balanceData, setBalanceData] = useState<TwilioBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTwilioBalanceAction();
      if (res.success && res.data) {
        setBalanceData(res.data);
      } else {
        setError(res.error || "Failed to load balance");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load balance");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshTrigger]);

  const rawBalance = balanceData?.balance ?? "0.00";
  const formattedBalance = rawBalance.startsWith("$")
    ? rawBalance
    : `$${rawBalance}`;
  const currency = balanceData?.currency || "USD";

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center gap-3.5 sm:gap-4 w-fit">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-blue-50/90 border border-blue-100 flex items-center justify-center text-[#0064cb] shrink-0">
          <Wallet className="w-4.5 h-4.5 text-[#0064cb]" strokeWidth={2} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Twilio Balance</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Available Twilio account balance for sending SMS & blast notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-1 mt-0.5">
            {isLoading ? (
              <div className="h-5 w-24 bg-slate-200 animate-pulse rounded my-0.5" />
            ) : error ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-500 font-medium">
                  Unavailable
                </span>
                <button
                  type="button"
                  onClick={fetchBalance}
                  title="Retry fetching balance"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-slate-900 font-bold text-base sm:text-lg tracking-tight">
                  {formattedBalance}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-500 ml-0.5">
                  {currency}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="h-7 w-[1px] bg-slate-200 shrink-0" />

      <a
        href={TWILIO_BILLING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center border border-[#0064cb] text-[#0064cb] hover:bg-blue-50 active:bg-blue-100 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
      >
        Add Credits
      </a>
    </div>
  );
}
