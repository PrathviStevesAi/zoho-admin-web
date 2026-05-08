"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  fetchInvoiceDetailsAction,
  updateInvoicePaymentStatusAction,
  fetchInvoiceShiftsAction,
  deleteShiftAction,
  fetchSecurityServicesAction,
  createShiftAction,
  assignGuardsAction,
  unassignGuardAction
} from "@/actions/dashboard.actions";
import { InvoiceData } from "@/types/dashboard.types";
import { toast } from "sonner";
import { DateTime } from "luxon";
import Swal from "sweetalert2";

// Import Modular Components
import { InvoiceHeader } from "./_components/InvoiceHeader";
import { InvoiceDetailsCard } from "./_components/InvoiceDetailsCard";
import { InvoiceHistorySidebar } from "./_components/InvoiceHistorySidebar";
import { PaymentModule } from "./_components/PaymentModule";
import { ShiftModule } from "./_components/ShiftModule";
import { AssignmentModule } from "./_components/AssignmentModule";
import { SelectUserDialog } from "./_components/SelectUserDialog";

function InvoiceSkeleton() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-5 h-[600px] rounded-xl" />
        <Skeleton className="lg:col-span-7 h-[600px] rounded-xl" />
      </div>
    </div>
  );
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  // Global State
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  // View States
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAssignGuardOpen, setIsAssignGuardOpen] = useState(false);

  // Details Logic State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });

  // Payment Logic State
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_status: "",
    reminder_date: "",
    per_hour_rate: 0,
    per_shift_rate: 0
  });

  // Shift Logic State
  const [shifts, setShifts] = useState<any[]>([]);
  const [isShiftsLoading, setIsShiftsLoading] = useState(false);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [addShiftData, setAddShiftData] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    service: "",
    people: 1
  });
  const [rowSchedules, setRowSchedules] = useState<Record<string, any>>({});

  // Guard Assignment State
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, { guard_id: string, guard_name: string }>>({});
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      setLoading(true);
      const res = await fetchInvoiceDetailsAction(id);
      if (res.success) {
        setInvoice(res.data);
        setFormData({
          title: res.data.customer_name || "",
          description: res.data.description || ""
        });
        setPaymentFormData({
          payment_status: res.data.payment_status || "pending",
          reminder_date: res.data.reminder_date || "",
          per_hour_rate: Number(res.data.per_hour_rate) || 0,
          per_shift_rate: Number(res.data.per_shift_rate) || 0
        });
      } else {
        toast.error(res.error || "Failed to load invoice");
      }
      setLoading(false);
    }
    loadInvoice();
    loadServices();
  }, [id]);

  const loadServices = async () => {
    const result = await fetchSecurityServicesAction();
    if (result.success && result.data) {
      setServices(result.data);
    }
  };

  const loadShifts = async (view: string = "schedule") => {
    setIsShiftsLoading(true);
    const res = await fetchInvoiceShiftsAction(id, view);
    if (res.success && res.data) {
      setShifts(res.data);
    } else {
      toast.error(res.error || "Failed to load shifts");
    }
    setIsShiftsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setIsEditOpen(false);
    toast.success("Invoice updated successfully");
  };

  const handleUpdatePayment = async () => {
    setIsUpdatingPayment(true);
    const res = await updateInvoicePaymentStatusAction({
      invoice_id: id,
      ...paymentFormData
    });
    if (res.success) {
      toast.success("Payment status updated successfully");
      setIsPaymentOpen(false);
      const refreshed = await fetchInvoiceDetailsAction(id);
      if (refreshed.success) setInvoice(refreshed.data);
    } else {
      toast.error(res.error || "Failed to update payment status");
    }
    setIsUpdatingPayment(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this shift schedule?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#fff',
      width: '320px',
      padding: '1rem',
      customClass: {
        popup: 'rounded-xl border border-slate-100 shadow-xl',
        icon: '-mb-2 !mt-2 scale-[0.6]',
        title: 'text-sm font-bold text-slate-800 !pt-0 !mt-0',
        htmlContainer: 'text-[12px] text-slate-500 !p-0 !mt-0',
        actions: 'mt-4 gap-3',
        confirmButton: 'cursor-pointer bg-[#0064cb] hover:bg-[#0052ae] text-white px-5 h-9 rounded-lg text-xs font-bold transition-all',
        cancelButton: 'cursor-pointer bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 h-9 rounded-lg text-xs font-bold transition-all'
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      const res = await deleteShiftAction(shiftId);
      if (res.success) {
        toast.success("Shift deleted successfully");
        loadShifts(isAssignGuardOpen ? "assign_guard" : "schedule");
      } else {
        toast.error(res.error || "Failed to delete shift");
      }
    }
  };

  const calculateHours = (date: Date, startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const dateStr = date.toISOString().split('T')[0];
    const start = DateTime.fromISO(`${dateStr}T${startTime}`);
    let end = DateTime.fromISO(`${dateStr}T${endTime}`);
    if (!start.isValid || !end.isValid) return "";
    if (end < start) end = end.plus({ days: 1 });
    const diff = end.diff(start, ['hours', 'minutes']).toObject();
    const hours = (diff.hours || 0) + (diff.minutes || 0) / 60;
    return hours.toFixed(2);
  };

  const handleRowChange = (dateKey: string, field: string, value: any) => {
    setRowSchedules(prev => {
      const current = prev[dateKey] || { checked: true, hours: "", startTime: "", endTime: "" };
      const updated = { ...current, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        const date = new Date(dateKey);
        updated.hours = calculateHours(date, updated.startTime, updated.endTime);
      } else if (field === 'hours') {
        const hoursNum = parseFloat(value);
        if (!isNaN(hoursNum)) {
          const startTime = updated.startTime || "09:00";
          updated.startTime = startTime;
          const start = DateTime.fromISO(`${new Date(dateKey).toISOString().split('T')[0]}T${startTime}`);
          if (start.isValid) updated.endTime = start.plus({ hours: hoursNum }).toFormat("HH:mm");
        }
      }
      return { ...prev, [dateKey]: updated };
    });
  };

  const getDatesList = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return [];
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const handleCreateShifts = async () => {
    if (!addShiftData.service) {
      toast.error("Please select a service");
      return;
    }
    const schedule = [];
    const dates = getDatesList(addShiftData.dateFrom, addShiftData.dateTo);
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const row = rowSchedules[dateKey];
      if (row && row.checked && row.startTime && row.endTime) {
        let end_date = dateKey;
        if (row.endTime < row.startTime) {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          end_date = nextDay.toISOString().split('T')[0];
        }
        schedule.push({
          start_date: `${dateKey}T${row.startTime}:00`,
          end_date: `${end_date}T${row.endTime}:00`,
          total_hr: parseFloat(row.hours)
        });
      }
    }
    if (schedule.length === 0) {
      toast.error("Please add at least one shift schedule");
      return;
    }
    setIsCreatingShift(true);
    const result = await createShiftAction({ invoice_id: id, service_id: addShiftData.service, schedule });
    if (result.success) {
      toast.success("Shifts created successfully");
      setIsAddingShift(false);
      loadShifts();
    } else {
      toast.error(result.error || "Failed to create shifts");
    }
    setIsCreatingShift(false);
  };
  const handleGuardSelect = (guard: any) => {
    const newAssignments = { ...pendingAssignments };
    selectedShiftIds.forEach(id => {
      newAssignments[id] = { guard_id: guard.guard_id, guard_name: `${guard.first_name} ${guard.last_name}` };
    });
    setPendingAssignments(newAssignments);
    setIsSelectUserOpen(false);
    setSelectedShiftIds([]);
    toast.success(`Guard ${guard.first_name} ${guard.last_name} selected for ${selectedShiftIds.length} shifts`);
  };

  const handleAssignGuards = async () => {
    const guardGroups: Record<string, string[]> = {};
    Object.entries(pendingAssignments).forEach(([shiftId, data]) => {
      if (!guardGroups[data.guard_id]) guardGroups[data.guard_id] = [];
      guardGroups[data.guard_id].push(shiftId);
    });

    const assignments = Object.entries(guardGroups).map(([guard_id, shift_ids]) => ({
      guard_id,
      shift_ids
    }));

    if (assignments.length === 0) {
      toast.error("Please assign at least one guard");
      return;
    }

    setIsAssigning(true);
    const res = await assignGuardsAction({
      invoice_id: id,
      per_hour_rate: paymentFormData.per_hour_rate,
      per_shift_rate: paymentFormData.per_shift_rate,
      assignments
    });

    if (res.success) {
      toast.success("Guards assigned successfully");
      setPendingAssignments({});
      loadShifts("assign_guard");
    } else {
      toast.error(res.error || "Failed to assign guards");
    }
    setIsAssigning(false);
  };

  const handleUnassignGuard = async (shiftOfferId: string) => {
    if (!shiftOfferId) {
      toast.error("Shift offer ID not found");
      return;
    }

    const result = await Swal.fire({
      title: 'Unassign Guard?',
      text: "This will remove the guard from this shift.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unassign',
      cancelButtonText: 'Cancel',
      background: '#fff',
      width: '320px',
      padding: '1rem',
      customClass: {
        popup: 'rounded-xl border border-slate-100 shadow-xl',
        icon: '-mb-2 !mt-2 scale-[0.6]',
        title: 'text-sm font-bold text-slate-800 !pt-0 !mt-0',
        htmlContainer: 'text-[12px] text-slate-500 !p-0 !mt-0',
        actions: 'mt-4 gap-3',
        confirmButton: 'cursor-pointer bg-red-500 hover:bg-red-600 text-white px-5 h-9 rounded-lg text-xs font-bold transition-all',
        cancelButton: 'cursor-pointer bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 h-9 rounded-lg text-xs font-bold transition-all'
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      setIsShiftsLoading(true);
      const res = await unassignGuardAction(shiftOfferId);
      if (res.success) {
        toast.success("Guard unassigned successfully");
        loadShifts("assign_guard");
      } else {
        toast.error(res.error || "Failed to unassign guard");
      }
      setIsShiftsLoading(false);
    }
  };

  if (loading) return <InvoiceSkeleton />;

  if (!invoice) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-[#f8fafc] p-6 overflow-hidden">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">Invoice Not Found</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                The invoice you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button className="w-full bg-[#0064cb] hover:bg-[#0052ae] h-11 rounded-xl font-bold shadow-lg shadow-[#0064cb]/20 transition-all active:scale-95">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      <InvoiceHeader
        invoiceNo={invoice.invoice_no}
        onOpenPayment={() => { setIsPaymentOpen(true); setIsScheduleOpen(false); setIsAssignGuardOpen(false); }}
        onOpenSchedule={() => { setIsScheduleOpen(true); setIsPaymentOpen(false); setIsAssignGuardOpen(false); setIsAddingShift(false); loadShifts("schedule"); }}
        onOpenAssignGuard={() => { setIsAssignGuardOpen(true); setIsScheduleOpen(false); setIsPaymentOpen(false); loadShifts("assign_guard"); }}
        onResetView={() => { setIsScheduleOpen(false); setIsPaymentOpen(false); setIsAssignGuardOpen(false); }}
      />

      {isPaymentOpen ? (
        <PaymentModule
          formData={paymentFormData}
          setFormData={setPaymentFormData}
          isUpdating={isUpdatingPayment}
          onUpdate={handleUpdatePayment}
          onCancel={() => setIsPaymentOpen(false)}
        />
      ) : isScheduleOpen ? (
        <ShiftModule
          shifts={shifts}
          isLoading={isShiftsLoading}
          isAdding={isAddingShift}
          onAdd={() => setIsAddingShift(true)}
          onCancelAdd={() => setIsAddingShift(false)}
          onDelete={handleDeleteShift}
          onBack={() => setIsScheduleOpen(false)}
          services={services}
          addShiftData={addShiftData}
          setAddShiftData={setAddShiftData}
          rowSchedules={rowSchedules}
          handleRowChange={handleRowChange}
          getDatesList={getDatesList}
          onCreateShifts={handleCreateShifts}
          isCreating={isCreatingShift}
        />
      ) : isAssignGuardOpen ? (
        <AssignmentModule
          shifts={shifts}
          isLoading={isShiftsLoading}
          onDeleteShift={handleDeleteShift}
          onOpenSelectUser={(ids) => {
            setSelectedShiftIds(ids);
            setIsSelectUserOpen(true);
          }}
          onBack={() => setIsAssignGuardOpen(false)}
          pendingAssignments={pendingAssignments}
          onAdd={handleAssignGuards}
          onUnassignGuard={handleUnassignGuard}
          isAssigning={isAssigning}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-8 space-y-6">
            <InvoiceDetailsCard
              invoice={invoice}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              isSaving={isSaving}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
            />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <InvoiceHistorySidebar history={invoice.history} />
          </div>
        </div>
      )}

      <SelectUserDialog
        isOpen={isSelectUserOpen}
        onClose={() => setIsSelectUserOpen(false)}
        onSelect={handleGuardSelect}
        selectedShiftIds={selectedShiftIds}
      />
    </div>
  );
}
