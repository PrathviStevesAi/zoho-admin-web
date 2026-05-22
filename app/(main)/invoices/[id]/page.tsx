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
  unassignGuardAction,
  cancelInvoiceServiceAction,
  updateInvoiceDetailsAction
} from "@/actions/dashboard.actions";
import { InvoiceData } from "@/types/dashboard.types";
import { toast } from "sonner";
import { DateTime } from "luxon";
import { InvoiceHeader } from "./_components/InvoiceHeader";
import { InvoiceDetailsCard } from "./_components/InvoiceDetailsCard";
import { InvoiceHistorySidebar } from "./_components/InvoiceHistorySidebar";
import { PaymentModule } from "./_components/PaymentModule";
import { ShiftModule } from "./_components/ShiftModule";
import { AssignmentModule } from "./_components/AssignmentModule";
import { SelectUserDialog } from "./_components/SelectUserDialog";
import { EditLocationDialog } from "./_components/EditLocationDialog";
import { CancelServiceDialog } from "./_components/CancelServiceDialog";
import { ConfirmationDialog } from "./_components/ConfirmationDialog";
import { AvailableGuardsModule } from "./_components/AvailableGuardsModule";
import { ShippingAddress } from "@/types/dashboard.types";
import { fetchAvailableGuardsAction } from "@/actions/dashboard.actions";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAssignGuardOpen, setIsAssignGuardOpen] = useState(false);
  const [isAvailableGuardsOpen, setIsAvailableGuardsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", shift_description: "" });
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [isCancelServiceOpen, setIsCancelServiceOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, shiftId: string }>({ isOpen: false, shiftId: "" });
  const [unassignConfirm, setUnassignConfirm] = useState<{ isOpen: boolean, shiftOfferId: string }>({ isOpen: false, shiftOfferId: "" });
  const [invoiceTimezone, setInvoiceTimezone] = useState<string>('America/Los_Angeles');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<{
    payment_status: string;
    reminder_date: string;
    per_hour_rate: string | number;
    per_shift_rate: string | number;
  }>({
    payment_status: "",
    reminder_date: "",
    per_hour_rate: "",
    per_shift_rate: ""
  });
  const [shifts, setShifts] = useState<any[]>([]);
  const [isShiftsLoading, setIsShiftsLoading] = useState(false);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [addShiftData, setAddShiftData] = useState({
    dateFrom: formatDateKey(new Date()),
    dateTo: formatDateKey(new Date()),
    service: "",
    people: 1
  });
  const [rowSchedules, setRowSchedules] = useState<Record<string, any>>({});
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, { guard_id: string, guard_name: string }>>({});
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [isAvailableGuardsLoading, setIsAvailableGuardsLoading] = useState(false);
  const [totalAvailableGuards, setTotalAvailableGuards] = useState(0);

  useEffect(() => {
    async function loadInvoice() {
      setLoading(true);
      const res = await fetchInvoiceDetailsAction(id);
      if (res.success) {
        setInvoice(res.data);
        setInvoiceTimezone(res.data.timezone || 'America/Los_Angeles');
        setFormData({
          title: res.data.customer_name || "",
          description: res.data.invoice_description || res.data.description || "",
          shift_description: res.data.shift_description || ""
        });
        const initialPerHour = Number(res.data.per_hour_rate);
        const initialPerShift = Number(res.data.per_shift_rate);
        setPaymentFormData({
          payment_status: res.data.payment_status || "pending",
          reminder_date: res.data.reminder_date || "",
          per_hour_rate: initialPerHour && initialPerHour > 0 ? String(initialPerHour) : "",
          per_shift_rate: initialPerShift && initialPerShift > 0 ? String(initialPerShift) : ""
        });
      } else {
        toast.error(res.error || "Failed to load invoice");
      }
      setLoading(false);
      console.log('responseee', res);
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
    console.log("Shift Schedule table data response:", res);
    if (res.success && res.data) {
      setShifts(res.data);
    } else {
      toast.error(res.error || "Failed to load shifts");
    }
    setIsShiftsLoading(false);
  };

  const loadAvailableGuards = async () => {
    setIsAvailableGuardsLoading(true);
    const res = await fetchAvailableGuardsAction(id);
    if (res.success && res.data) {
      setAvailableGuards(res.data);
      setTotalAvailableGuards(res.total_guards || 0);
    } else {
      toast.error(res.error || "Failed to load available guards");
    }
    setIsAvailableGuardsLoading(false);
  };

  const handleEditLocation = () => setIsEditLocationOpen(true);

  const handleLocationUpdate = async (address: ShippingAddress) => {
    setIsSaving(true);
    const res = await updateInvoiceDetailsAction({
      invoice_id: id,
      shipping_address: address
    });
    if (res.success) {
      toast.success("Location updated successfully");
      const refreshed = await fetchInvoiceDetailsAction(id);
      if (refreshed.success) setInvoice(refreshed.data);
      setIsEditLocationOpen(false);
    } else {
      toast.error(res.error || "Failed to update location");
    }
    setIsSaving(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateInvoiceDetailsAction({
      invoice_id: id,
      customer_name: formData.title?.trim(),
      invoice_description: formData.description?.trim(),
      shift_description: formData.shift_description?.trim()
    });
    if (res.success) {
      toast.success("Details updated successfully");
      const refreshed = await fetchInvoiceDetailsAction(id);
      if (refreshed.success) {
        setInvoice(refreshed.data);
        setIsEditOpen(false);
      }
    } else {
      toast.error(res.error || "Failed to update details");
    }
    setIsSaving(false);
  };

  const handleCancelService = () => setIsCancelServiceOpen(true);

  const handleConfirmCancel = async (reason: string) => {
    setIsCancelling(true);
    try {
      console.log("Calling cancelInvoiceServiceAction with 15s timeout...");

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out but may have succeeded. Please refresh.")), 15000)
      );

      const res = await Promise.race([
        cancelInvoiceServiceAction({
          invoice_id: id,
          reason: reason
        }),
        timeoutPromise
      ]) as any;

      console.log("API Result received:", res);

      if (res && res.success) {
        toast.success("Service cancelled successfully");
        setIsCancelServiceOpen(false);
        fetchInvoiceDetailsAction(id).then(refreshed => {
          if (refreshed.success) {
            setInvoice(refreshed.data);
          } else {
            window.location.reload();
          }
        });
      } else {
        toast.error(res?.error || "Failed to cancel service");
      }
    } catch (error: any) {
      console.error("Cancellation exception:", error);
      if (error.message?.includes("timed out")) {
        toast.info("Request took longer than expected. Refreshing data...");
        setIsCancelServiceOpen(false);
        fetchInvoiceDetailsAction(id).then(refreshed => {
          if (refreshed.success) setInvoice(refreshed.data);
          else window.location.reload();
        });
      } else {
        toast.error(error.message || "Failed to cancel service");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentFormData.payment_status) {
      toast.error("Payment status is mandatory");
      return;
    }
    setIsUpdatingPayment(true);
    const formatRate = (val: any) => {
      if (val === null || val === undefined) return "";
      const sVal = String(val).trim();
      if (sVal === "" || parseFloat(sVal) === 0 || isNaN(parseFloat(sVal))) {
        return "";
      }
      return sVal;
    };

    const payload: any = {
      invoice_id: id,
      payment_status: paymentFormData.payment_status
    };

    if (invoice) {
      const currentReminder = paymentFormData.reminder_date || "";
      const originalReminder = invoice.reminder_date || "";
      if (currentReminder !== originalReminder) {
        payload.reminder_date = currentReminder;
      }
      const currentPerHour = formatRate(paymentFormData.per_hour_rate);
      const originalPerHour = formatRate(invoice.per_hour_rate);
      if (currentPerHour !== originalPerHour) {
        payload.per_hour_rate = currentPerHour;
      }
      const currentPerShift = formatRate(paymentFormData.per_shift_rate);
      const originalPerShift = formatRate(invoice.per_shift_rate);
      if (currentPerShift !== originalPerShift) {
        payload.per_shift_rate = currentPerShift;
      }
    } else {
      payload.reminder_date = paymentFormData.reminder_date || "";
      payload.per_hour_rate = formatRate(paymentFormData.per_hour_rate);
      payload.per_shift_rate = formatRate(paymentFormData.per_shift_rate);
    }

    if (payload.per_hour_rate === "") delete payload.per_hour_rate;
    if (payload.per_shift_rate === "") delete payload.per_shift_rate;
    if (payload.reminder_date === "") delete payload.reminder_date;

    console.log("[handleUpdatePayment] Submitting payment update payload:", payload);
    const res = await updateInvoicePaymentStatusAction(payload);
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

  const handleDeleteShift = (shiftId: string) => setDeleteConfirm({ isOpen: true, shiftId });

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.shiftId) return;
    setIsShiftsLoading(true);
    const res = await deleteShiftAction(deleteConfirm.shiftId);
    if (res.success) {
      toast.success("Shift deleted successfully");
      loadShifts(isAssignGuardOpen ? "assign_guard" : "schedule");
      setDeleteConfirm({ isOpen: false, shiftId: "" });
    } else {
      toast.error(res.error || "Failed to delete shift");
    }
    setIsShiftsLoading(false);
  };

  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const start = DateTime.fromISO(startTime, { zone: invoiceTimezone });
    let end = DateTime.fromISO(endTime, { zone: invoiceTimezone });
    if (!start.isValid || !end.isValid) return "";
    if (end < start) end = end.plus({ days: 1 });
    const diff = end.diff(start, ['hours', 'minutes']).toObject();
    const hours = (diff.hours || 0) + (diff.minutes || 0) / 60;
    return hours.toFixed(2);
  };

  const handleRowChange = (dateKey: string, field: string, value: any) => {
    setRowSchedules(prev => {
      const current = prev[dateKey] || {
        checked: true,
        hours: "",
        startTime: `${dateKey}T09:00`,
        endTime: `${dateKey}T17:00`
      };
      const updated = { ...current, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        updated.hours = calculateHours(updated.startTime, updated.endTime);
      } else if (field === 'hours') {
        const hoursNum = parseFloat(value);
        if (!isNaN(hoursNum)) {
          const start = DateTime.fromISO(updated.startTime, { zone: invoiceTimezone });
          if (start.isValid) {
            updated.endTime = start.plus({ hours: hoursNum }).toISO({ includeOffset: false }).slice(0, 16);
          }
        }
      }
      return { ...prev, [dateKey]: updated };
    });
  };

  const getDatesList = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return [];
    const dates = [];
    const startParts = startDate.split('-').map(Number);
    const endParts = endDate.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
      const dateKey = formatDateKey(date);
      const row = rowSchedules[dateKey];
      if (row && row.checked && row.startTime && row.endTime) {
        for (let p = 0; p < (addShiftData.people || 1); p++) {
          schedule.push({
            start_date: DateTime.fromISO(row.startTime, { zone: invoiceTimezone }).toUTC().toISO({ suppressMilliseconds: true }) || row.startTime,
            end_date: DateTime.fromISO(row.endTime, { zone: invoiceTimezone }).toUTC().toISO({ suppressMilliseconds: true }) || row.endTime,
            total_hr: parseFloat(row.hours)
          });
        }
      }
    }
    if (schedule.length === 0) {
      toast.error("Please add at least one shift schedule");
      return;
    }
    setIsCreatingShift(true);
    const payload = { invoice_id: id, service_id: addShiftData.service, schedule };
    console.log("[ShiftModule] Creating shifts with payload:", payload);

    const result = await createShiftAction(payload);
    console.log("[ShiftModule] Create shifts response:", result);

    if (result.success) {
      toast.success("Shifts created successfully");
      setIsAddingShift(false);
      setAddShiftData({
        dateFrom: formatDateKey(new Date()),
        dateTo: formatDateKey(new Date()),
        service: "",
        people: 1
      });
      setRowSchedules({});
      loadShifts();
    } else {
      toast.error(result.error || "Failed to create shifts");
    }
    setIsCreatingShift(false);
  };

  const handleGuardSelect = (guard: any) => {
    const currentBatchShifts = shifts.filter(s => selectedShiftIds.includes(s.shift_id));
    for (let i = 0; i < currentBatchShifts.length; i++) {
      for (let j = i + 1; j < currentBatchShifts.length; j++) {
        const s1 = currentBatchShifts[i];
        const s2 = currentBatchShifts[j];
        if (DateTime.fromISO(s1.start_time) < DateTime.fromISO(s2.end_time) &&
          DateTime.fromISO(s2.start_time) < DateTime.fromISO(s1.end_time)) {
          toast.error(`Overlap detected: Shift ${s1.shift_no} and ${s2.shift_no} happen at the same time. You cannot assign the same guard to both.`);
          return;
        }
      }
    }

    const existingGuardShifts = shifts.filter(s => {
      if (!s.guard) return false;

      const gid = typeof s.guard === 'object' ? (s.guard.guard_id || s.guard.id) : (s.guard_id || s.assigned_guard_id);
      if (gid && gid === guard.guard_id) return true;

      const sName = typeof s.guard === 'object'
        ? `${s.guard.first_name} ${s.guard.last_name}`.toLowerCase().trim()
        : String(s.guard).toLowerCase().trim();
      const gName = `${guard.first_name} ${guard.last_name}`.toLowerCase().trim();

      return sName === gName;
    });

    const pendingGuardShifts = shifts.filter(s =>
      pendingAssignments[s.shift_id] && pendingAssignments[s.shift_id].guard_id === guard.guard_id
    );

    const allAssignedShifts = [...existingGuardShifts, ...pendingGuardShifts];

    for (const newShift of currentBatchShifts) {
      for (const assigned of allAssignedShifts) {
        if (DateTime.fromISO(newShift.start_time) < DateTime.fromISO(assigned.end_time) &&
          DateTime.fromISO(assigned.start_time) < DateTime.fromISO(newShift.end_time)) {
          toast.error(`Guard ${guard.first_name} is already assigned to shift ${assigned.shift_no} during this time (${new Date(assigned.start_time).toLocaleTimeString()} - ${new Date(assigned.end_time).toLocaleTimeString()}).`);
          return;
        }
      }
    }

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
      per_hour_rate: Number(paymentFormData.per_hour_rate) || 0,
      per_shift_rate: Number(paymentFormData.per_shift_rate) || 0,
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

  const handleUnassignGuard = (shiftOfferId: string) => setUnassignConfirm({ isOpen: true, shiftOfferId });

  const handleConfirmUnassign = async () => {
    if (!unassignConfirm.shiftOfferId) return;
    setIsShiftsLoading(true);
    const res = await unassignGuardAction(unassignConfirm.shiftOfferId);
    if (res.success) {
      toast.success("Guard unassigned successfully");
      loadShifts("assign_guard");
      setUnassignConfirm({ isOpen: false, shiftOfferId: "" });
    } else {
      toast.error(res.error || "Failed to unassign guard");
    }
    setIsShiftsLoading(false);
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
              <p className="text-sm text-slate-800 leading-relaxed">
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

  const getCurrentViewName = () => {
    if (isPaymentOpen) return "Update Payment Status";
    if (isScheduleOpen) return "Schedule Shift";
    if (isAssignGuardOpen) return "Assign Guard";
    if (isAvailableGuardsOpen) return "Available Guards";
    return "";
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      <InvoiceHeader
        invoiceNo={invoice.invoice_no}
        customerName={invoice.customer_name}
        zohoInvoiceId={invoice.zoho_invoice_id}
        description={invoice.invoice_description || invoice.description || ""}
        onOpenPayment={() => { setIsPaymentOpen(true); setIsScheduleOpen(false); setIsAssignGuardOpen(false); }}
        onOpenSchedule={() => { setIsScheduleOpen(true); setIsPaymentOpen(false); setIsAssignGuardOpen(false); setIsAddingShift(false); loadShifts("schedule"); }}
        onOpenAssignGuard={() => {
          const paymentStatus = invoice?.payment_status?.toLowerCase();
          if (paymentStatus === 'pending' || paymentStatus === 'unpaid') {
            toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
              duration: 5000,
            });
            return;
          }
          setIsAssignGuardOpen(true);
          setIsScheduleOpen(false);
          setIsPaymentOpen(false);
          setIsAvailableGuardsOpen(false);
          loadShifts("assign_guard");
        }}
        onOpenAvailableGuards={() => {
          setIsAvailableGuardsOpen(true);
          setIsAssignGuardOpen(false);
          setIsScheduleOpen(false);
          setIsPaymentOpen(false);
          loadAvailableGuards();
          loadShifts("assign_guard");
        }}
        onResetView={() => { setIsScheduleOpen(false); setIsPaymentOpen(false); setIsAssignGuardOpen(false); setIsAvailableGuardsOpen(false); }}
        onCancelService={handleCancelService}
        currentView={getCurrentViewName()}
        status={invoice.status}
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
          onAdd={() => {
            const desc = invoice?.shift_description?.trim();
            if (!desc) {
              toast.error("Please add a shift description first before scheduling a shift.");
              setIsScheduleOpen(false);
            } else {
              setIsAddingShift(true);
            }
          }}
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
          timezone={invoiceTimezone}
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
          onRemovePendingAssignment={(shiftId) => {
            setPendingAssignments(prev => {
              const updated = { ...prev };
              delete updated[shiftId];
              return updated;
            });
          }}
          isAssigning={isAssigning}
        />
      ) : isAvailableGuardsOpen ? (
        <AvailableGuardsModule
          invoiceId={id}
          guards={availableGuards}
          shifts={shifts}
          totalGuards={totalAvailableGuards}
          isLoading={isAvailableGuardsLoading}
          onBack={() => setIsAvailableGuardsOpen(false)}
          onRefresh={loadAvailableGuards}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-7 space-y-6">
            <InvoiceDetailsCard
              invoice={invoice}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              isSaving={isSaving}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onEditLocation={handleEditLocation}
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
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

      <EditLocationDialog
        isOpen={isEditLocationOpen}
        onClose={() => setIsEditLocationOpen(false)}
        onUpdate={handleLocationUpdate}
        initialAddress={invoice.shipping_address}
        isSaving={isSaving}
      />

      <CancelServiceDialog
        isOpen={isCancelServiceOpen}
        onClose={() => setIsCancelServiceOpen(false)}
        onConfirm={handleConfirmCancel}
        isSaving={isCancelling}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, shiftId: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete Shift?"
        description="Are you sure you want to delete this shift schedule? This action cannot be undone."
        confirmText="Yes, delete it"
        isDanger={true}
        isLoading={isShiftsLoading}
      />

      <ConfirmationDialog
        isOpen={unassignConfirm.isOpen}
        onClose={() => setUnassignConfirm({ isOpen: false, shiftOfferId: "" })}
        onConfirm={handleConfirmUnassign}
        title="Unassign Guard?"
        description="This will remove the guard from this shift. Are you sure?"
        confirmText="Yes, unassign"
        isDanger={true}
        isLoading={isShiftsLoading}
      />
    </div>
  );
}
