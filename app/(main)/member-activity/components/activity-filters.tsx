"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export interface ActivityFilterState {
  searchEmail: string;
  memberEmail: string;
  status: string;
  dateFilter: string;
  startDate: string;
  endDate: string;
}

interface ActivityFiltersProps {
  filters: ActivityFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ActivityFilterState>>;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
  mounted: boolean;
}

export function ActivityFilters({ filters, setFilters, onSearch, onReset, loading, mounted }: ActivityFiltersProps) {
  const [members, setMembers] = useState<{ email: string; first_name: string; last_name: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;

  useEffect(() => {
    if (status === "loading") return;

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        const res = await fetch(`${baseUrl}/api/v1/member/list`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setMembers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [status, token]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Member Name</label>
          <Select 
            value={filters.memberEmail} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, memberEmail: val }))}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-[#0064cb]/20 h-10">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {loadingMembers ? (
                <div className="p-2 text-sm text-slate-500">Loading...</div>
              ) : (
                members.map((m) => (
                  <SelectItem key={m.email} value={m.email}>
                    {`${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Status</label>
          <Select 
            value={filters.status} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-[#0064cb]/20 h-10">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="record_touched">Record Touched</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Date Range</label>
          <Select 
            value={filters.dateFilter} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, dateFilter: val }))}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-[#0064cb]/20 h-10">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filters.dateFilter === "custom" && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#0064cb]/20 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#0064cb]/20 h-10"
              />
            </div>
          </>
        )}

        <div className="flex items-end h-full gap-2">
          <Button 
            onClick={onReset} 
            disabled={loading}
            variant="outline"
            className="flex-1 h-10 shadow-sm border-slate-200 text-slate-600 hover:text-slate-800"
          >
            Reset
          </Button>
          <Button 
            onClick={onSearch} 
            disabled={loading}
            className="flex-1 bg-[#0064cb] hover:bg-[#0052a3] text-white h-10 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
