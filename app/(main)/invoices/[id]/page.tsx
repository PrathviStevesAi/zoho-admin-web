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

// Import Modular Components
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
  const [isAvailableGuardsOpen, setIsAvailableGuardsOpen] = useState(false);

  // Details Logic State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", shift_description: "" });
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [isCancelServiceOpen, setIsCancelServiceOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, shiftId: string }>({ isOpen: false, shiftId: "" });
  const [unassignConfirm, setUnassignConfirm] = useState<{ isOpen: boolean, shiftOfferId: string }>({ isOpen: false, shiftOfferId: "" });

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

  // Available Guards State
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [isAvailableGuardsLoading, setIsAvailableGuardsLoading] = useState(false);
  const [totalAvailableGuards, setTotalAvailableGuards] = useState(0);

  useEffect(() => {
    async function loadInvoice() {
      setLoading(true);
      const res = await fetchInvoiceDetailsAction(id);
      if (res.success) {
        setInvoice(res.data);
        setFormData({
          title: res.data.customer_name || "",
          description: res.data.invoice_description || res.data.description || "",
          shift_description: res.data.shift_description || ""
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
        
        // Trigger refresh immediately
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
    const start = DateTime.fromISO(startTime);
    let end = DateTime.fromISO(endTime);
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
          const start = DateTime.fromISO(updated.startTime);
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
        // Create multiple objects based on # of people
        for (let p = 0; p < (addShiftData.people || 1); p++) {
          schedule.push({
            start_date: DateTime.fromISO(row.startTime).toUTC().toISO({ suppressMilliseconds: true }) || row.startTime,
            end_date: DateTime.fromISO(row.endTime).toUTC().toISO({ suppressMilliseconds: true }) || row.endTime,
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
      loadShifts();
    } else {
      toast.error(result.error || "Failed to create shifts");
    }
    setIsCreatingShift(false);
  };
  const handleGuardSelect = (guard: any) => {
    // 1. Get shift details for the current selection
    const currentBatchShifts = shifts.filter(s => selectedShiftIds.includes(s.shift_id));

    // 2. Check for overlaps within the current selection itself
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

    // 3. Check for overlaps with existing assignments for this guard (already in DB)
    const existingGuardShifts = shifts.filter(s => {
      if (!s.guard) return false;
      
      // Try ID match
      const gid = typeof s.guard === 'object' ? (s.guard.guard_id || s.guard.id) : (s.guard_id || s.assigned_guard_id);
      if (gid && gid === guard.guard_id) return true;
      
      // Fallback: Name match (useful if API only returns names or partial objects)
      const sName = typeof s.guard === 'object' 
        ? `${s.guard.first_name} ${s.guard.last_name}`.toLowerCase().trim()
        : String(s.guard).toLowerCase().trim();
      const gName = `${guard.first_name} ${guard.last_name}`.toLowerCase().trim();
      
      return sName === gName;
    });

    // 4. Check for overlaps with pending assignments for this guard
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
