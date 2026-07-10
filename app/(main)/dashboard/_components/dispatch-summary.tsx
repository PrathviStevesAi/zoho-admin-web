"use client";

import { useEffect, useState } from "react";
import { fetchShiftCountsAction, fetchDispatchViewShiftsAction } from "@/actions/dashboard.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface SummaryCardProps {
    label: string;
    value: string | number;
    variant?: "default" | "success" | "warning";
    onClick?: () => void;
}

function SummaryCard({ label, value, variant = "default", onClick }: SummaryCardProps) {
    const variants = {
        default: "bg-slate-50 border-slate-100",
        success: "bg-emerald-50/50 border-emerald-100/50",
        warning: "bg-rose-50/50 border-rose-100/50"
    };

    const textVariants = {
        default: "text-slate-800",
        success: "text-emerald-600",
        warning: "text-rose-600"
    };

    const valueVariants = {
        default: "text-slate-900",
        success: "text-emerald-700",
        warning: "text-rose-700"
    };

    return (
        <Card 
            className={cn("border shadow-none rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer", variants[variant])}
            onClick={onClick}
        >
            <CardContent className="p-5 flex flex-col gap-2">
                <span className={cn("text-sm font-semibold tracking-wider", textVariants[variant])}>
                    {label}
                </span>
                <span className={cn("text-lg font-bold", valueVariants[variant])}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
            </CardContent>
        </Card>
    );
}

export function DispatchSummary() {
    const router = useRouter();
    const [counts, setCounts] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("Information");
    const [dialogData, setDialogData] = useState<any[]>([]);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function loadCounts() {
            const res = await fetchShiftCountsAction();
            if (res.success) {
                setCounts(res.data);
            }
            setIsLoading(false);
        }
        loadCounts();
    }, []);

    const fetchDialogData = async (type: string, search: string = "") => {
        setIsDialogLoading(true);
        const res = await fetchDispatchViewShiftsAction(type, 1, search);
        if (res.success) {
            setDialogData(res.data || []);
        } else {
            setDialogData([]);
        }
        setIsDialogLoading(false);
    };

    const handleCardClick = (label: string) => {
        let type = "";
        switch (label) {
            case "All Shifts":
                type = "all_shifts";
                break;
            case "Finished Shifts":
                type = "finished_shifts";
                break;
            case "Out of geofence":
                type = "out_of_geofence_shifts";
                break;
            case "Late to start":
                type = "late_to_start_shifts";
                break;
            case "Late to clock out":
                type = "late_to_end_shifts";
                break;
        }
        setSelectedType(type);
        setSelectedLabel(label);
        setSearchQuery("");
        fetchDialogData(type, "");
        setIsDialogOpen(true);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isDialogOpen && selectedType) {
                fetchDialogData(selectedType, searchQuery);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const data = counts || { scheduled: 0, finished: 0, late_shift_start: 0, late_shift_end: 0, out_of_geofence: 0 };

    const formatStatus = (status: string) => {
        if (!status) return "";
        return status
            .replace("shift_", "")
            .split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <SummaryCard label="All Shifts" value={data.scheduled} variant="default" onClick={() => handleCardClick("All Shifts")} />
                <SummaryCard label="Finished Shifts" value={data.finished} variant="success" onClick={() => handleCardClick("Finished Shifts")} />
                <SummaryCard label="Out of geofence" value={data.out_of_geofence} variant="warning" onClick={() => handleCardClick("Out of geofence")} />
                <SummaryCard label="Late to start" value={data.late_shift_start} variant="warning" onClick={() => handleCardClick("Late to start")} />
                <SummaryCard label="Late to clock out" value={data.late_shift_end} variant="warning" onClick={() => handleCardClick("Late to clock out")} />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col p-6">
                    <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b shrink-0 space-y-0 text-left pr-8">
                        <DialogTitle className="text-xl font-semibold">{selectedLabel}</DialogTitle>
                        <div className="relative w-72 mr-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search..." 
                                className="pl-9 bg-slate-50/50 border border-slate-200 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-auto mt-4 rounded-md border">
                        <Table>
                            <TableHeader className="bg-blue-50 sticky top-0 z-10">
                                <TableRow className="hover:bg-blue-50/90">
                                    <TableHead className="w-[100px] text-xs font-semibold text-black uppercase">Shift no</TableHead>
                                    <TableHead className="text-xs font-semibold text-black uppercase">Name</TableHead>
                                    <TableHead className="text-xs font-semibold text-black uppercase">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-black uppercase">Service Location</TableHead>
                                    <TableHead className="text-xs font-semibold text-black uppercase">Schedule For</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isDialogLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="h-4 w-[120px]" />
                                                    <Skeleton className="h-3 w-[80px]" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : dialogData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No data found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dialogData.map((shift, i) => (
                                        <TableRow 
                                            key={shift.shift_id || i} 
                                            className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/shift/view?shift_id=${shift.shift_id}`)}
                                        >
                                            <TableCell className="font-medium group-hover:text-blue-600 transition-colors">{shift.shift_no}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col group-hover:text-blue-600 transition-colors">
                                                    <span>{shift.customer_name}</span>
                                                    {shift.invoice_no && (
                                                        <span className="text-xs text-muted-foreground group-hover:text-blue-400 transition-colors">[{shift.invoice_no}]</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatStatus(shift.shift_status)}</TableCell>
                                            <TableCell className="max-w-[250px] truncate" title={shift.shift_location}>
                                                {shift.shift_location}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{shift.start_time}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
