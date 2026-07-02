"use client";

import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { GuardPriceTab } from "../guard-bank/components/guard-price-tab";

export default function GuardPricePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [loading, setLoading] = useState(false);
  const [pricesData, setPricesData] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [selectedTerritory, setSelectedTerritory] = useState("all");
  const [submittingPrices, setSubmittingPrices] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const session = await getSession() as any;
        const token = session?.accessToken;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        const res = await fetch(`${baseUrl}/api/v1/guard/price`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const data = await res.json();
        if (data.success) {
          setPricesData(data.data || {});
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const handleSubmitPrices = async () => {
    setSubmittingPrices(true);
    try {
      const session = await getSession() as any;
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${baseUrl}/api/v1/guard/price`, {
        method: "PUT",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ data: pricesData })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Guard prices updated successfully!");
      } else {
        toast.error(data.message || "Failed to update guard prices.");
      }
    } catch (error: any) {
      console.error("Failed to submit prices:", error);
      toast.error(error.message || "An error occurred while saving prices.");
    } finally {
      setSubmittingPrices(false);
    }
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Price</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guard Price</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border-none overflow-hidden">
        <div className="p-6 min-h-[500px] flex flex-col">
          <GuardPriceTab
            pricesData={pricesData}
            setPricesData={setPricesData}
            selectedTerritory={selectedTerritory}
            setSelectedTerritory={setSelectedTerritory}
            submittingPrices={submittingPrices}
            handleSubmitPrices={handleSubmitPrices}
            loading={loading}
            mounted={mounted}
          />
        </div>
      </div>
    </div>
  );
}
