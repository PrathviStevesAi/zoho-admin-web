"use client";

import {
  clientFetchInvoiceDetailsAction,
  clientFetchInvoiceShiftsAction,
  clientFetchSecurityServicesAction,
  clientFetchAvailableGuardsAction,
} from "@/lib/client-actions";
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
  updateInvoicePaymentStatusAction,
  deleteShiftAction,
  createShiftAction,
  assignGuardsAction,
  unassignGuardAction,
  cancelInvoiceServiceAction,
  updateInvoiceDetailsAction,
  updateShiftDetailsAction,
  assignStandbyGuardsAction
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
import { VerifyWarningDialog } from "./_components/VerifyWarningDialog";
import { verifyGuardAssignmentAction } from "@/actions/dashboard.actions";
import { ConfirmationDialog } from "./_components/ConfirmationDialog";
import { AvailableGuardsModule } from "./_components/AvailableGuardsModule";
import { EditShiftDialog } from "./_components/EditShiftDialog";
import { ShippingAddress } from "@/types/dashboard.types";
import { ActionErrorDialog } from "./_components/ActionErrorDialog";
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
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ isOpen: boolean, shiftId: string }>({ isOpen: false, shiftId: "" });
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [isSavingShift, setIsSavingShift] = useState(false);
  const [unassignConfirm, setUnassignConfirm] = useState<{ isOpen: boolean, shiftOfferId: string, type: "lead_guard" | "standby_guard" }>({ isOpen: false, shiftOfferId: "", type: "lead_guard" });
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
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, { guard_id: string, guard_name: string, hourlyRate?: number, travelFee?: number, type: "lead" | "standby", flatQcRate?: number }>>({});
  const [assignmentType, setAssignmentType] = useState<"lead" | "standby">("lead");
  
  const [verifyWarning, setVerifyWarning] = useState<{
    isOpen: boolean;
    warnings: string[];
    pendingPayloads?: {
      leadAssignments: any[];
      standbyAssignments: any[];
      clearSelection?: () => void;
    };
  }>({ isOpen: false, warnings: [] });

  const [isAssigning, setIsAssigning] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [isAvailableGuardsLoading, setIsAvailableGuardsLoading] = useState(false);
  const [totalAvailableGuards, setTotalAvailableGuards] = useState(0);
  const [actionError, setActionError] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ""});

  const loadInvoice = async () => {
    setLoading(true);
    const res = await clientFetchInvoiceDetailsAction(id);
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
        payment_status: res.data.payment_status || "",
        reminder_date: res.data.reminder_date || "",
        per_hour_rate: initialPerHour && initialPerHour > 0 ? String(initialPerHour) : "",
        per_shift_rate: initialPerShift && initialPerShift > 0 ? String(initialPerShift) : ""
      });

      if (typeof window !== "undefined" && window.location.hash) {
        if (window.location.hash === "#edit") {
          setIsEditOpen(true);
        } else if (window.location.hash === "#edit-location") {
          setIsEditLocationOpen(true);
        }
      }
    } else {
      toast.error(res.error || "Failed to load invoice");
    }
    setLoading(false);
    console.log('responseee', res);
  };

  useEffect(() => {
    loadInvoice();
    loadServices();
  }, [id]);

  const loadServices = async () => {
    const result = await clientFetchSecurityServicesAction();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/security-service`;
    console.log("Select Service Drop Down Data:", result.data);
    console.log("Select Service API URL:", apiUrl);
    if (result.success && result.data) {
      setServices(result.data);
    }
  };

  const loadShifts = async (view: string = "schedule") => {
    setIsShiftsLoading(true);
    const res = await clientFetchInvoiceShiftsAction(id, view);
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
    const res = await clientFetchAvailableGuardsAction(id);
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
      setIsEditLocationOpen(false);
      setIsSaving(false);
      // Re-fetch all sections data
      await loadInvoice();
      loadServices();
      return;
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
      const refreshed = await clientFetchInvoiceDetailsAction(id);
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
        clientFetchInvoiceDetailsAction(id).then((refreshed: any) => {
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
        clientFetchInvoiceDetailsAction(id).then((refreshed: any) => {
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
      const refreshed = await clientFetchInvoiceDetailsAction(id);
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

  const handleDuplicateShift = (shiftId: string) => setDuplicateConfirm({ isOpen: true, shiftId });

  const handleConfirmDuplicate = async () => {
    if (!duplicateConfirm.shiftId) return;
    setIsShiftsLoading(true);

    const originalShift = shifts.find(s => s.shift_id === duplicateConfirm.shiftId);
    if (!originalShift) {
      toast.error("Original shift details not found");
      setIsShiftsLoading(false);
      return;
    }

    const start = DateTime.fromISO(originalShift.start_time);
    const end = DateTime.fromISO(originalShift.end_time);
    let total_hr = end.diff(start, 'hours').hours;
    if (isNaN(total_hr) || total_hr <= 0) {
      total_hr = 0;
    }

    const payload = {
      invoice_id: id,
      service_id: originalShift.service_id || originalShift.security_service_id,
      schedule: [
        {
          start_date: originalShift.start_time,
          end_date: originalShift.end_time,
          total_hr: parseFloat(total_hr.toFixed(2))
        }
      ]
    };

    console.log("[handleConfirmDuplicate] Duplicating shift via createShiftAction:", payload);
    const res = await createShiftAction(payload);
    if (res.success) {
      toast.success("Shift duplicated successfully");
      loadShifts(isAssignGuardOpen ? "assign_guard" : "schedule");
      setDuplicateConfirm({ isOpen: false, shiftId: "" });
    } else {
      toast.error(res.error || "Failed to duplicate shift");
    }
    setIsShiftsLoading(false);
  };

  const handleEditShift = (shiftId: string) => {
    const shift = shifts.find(s => s.shift_id === shiftId);
    if (shift) {
      setEditingShift(shift);
      setIsEditShiftOpen(true);
    } else {
      toast.error("Shift details not found");
    }
  };

  const handleUpdateShift = async (data: {
    shift_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
  }) => {
    setIsSavingShift(true);

    const originalShift = shifts.find(s => s.shift_id === data.shift_id);
    const originalServiceId = originalShift?.service_id || originalShift?.security_service_id;
    const isServiceChanged = originalShift && originalServiceId !== data.service_id;

    const payload: any = {
      shift_id: data.shift_id,
      shift_time: {
        start_time: data.start_time,
        end_time: data.end_time
      }
    };

    if (isServiceChanged) {
      payload.security_service_id = data.service_id;
    }

    console.log("[handleUpdateShift] Updating shift details with payload:", payload);
    const res = await updateShiftDetailsAction(payload);
    if (res.success) {
      toast.success("Shift updated successfully");
      setIsEditShiftOpen(false);
      setEditingShift(null);
      loadShifts(isAssignGuardOpen ? "assign_guard" : "schedule");
    } else {
      toast.error(res.error || "Failed to update shift");
    }
    setIsSavingShift(false);
  };

  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const start = DateTime.fromISO(startTime, { zone: invoiceTimezone });
    let end = DateTime.fromISO(endTime, { zone: invoiceTimezone });
    if (!start.isValid || !end.isValid) return "";
    if (end < start) end = end.plus({ days: 1 });
    const diff = end.diff(start, ['hours', 'minutes']).toObject();
    let h = diff.hours || 0;
    let m = Math.round(diff.minutes || 0);
    if (h === 0 && m === 0) {
      m = 1;
    }
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const handleRowChange = (dateKey: string, field: string, value: any) => {
    setRowSchedules(prev => {
      const current = prev[dateKey] || {
        checked: true,
        hours: "",
        startTime: "",
        endTime: ""
      };
      const updated = { ...current, [field]: value };
      const parseHours = (val: string) => {
        if (typeof val === 'string' && val.includes(':')) {
          const parts = val.split(':');
          return (parseFloat(parts[0]) || 0) + (parseFloat(parts[1]) || 0) / 60;
        }
        return parseFloat(val);
      };

      if (field === 'startTime') {
        const hoursNum = parseHours(updated.hours);
        if (!isNaN(hoursNum) && updated.hours !== "") {
          const start = DateTime.fromISO(updated.startTime, { zone: invoiceTimezone });
          if (start.isValid) {
            updated.endTime = start.plus({ hours: hoursNum }).toISO({ includeOffset: false }).slice(0, 16);
          }
        } else if (updated.startTime && updated.endTime) {
          updated.hours = calculateHours(updated.startTime, updated.endTime);
        }
      } else if (field === 'endTime') {
        if (updated.startTime && updated.endTime) {
          updated.hours = calculateHours(updated.startTime, updated.endTime);
        }
      } else if (field === 'hours') {
        if (value === "") {
          updated.endTime = "";
        } else {
          const hoursNum = parseHours(value);
          if (!isNaN(hoursNum)) {
            const start = DateTime.fromISO(updated.startTime, { zone: invoiceTimezone });
            if (start.isValid) {
              updated.endTime = start.plus({ hours: hoursNum }).toISO({ includeOffset: false }).slice(0, 16);
            }
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
      const row = rowSchedules[dateKey] || { checked: true, hours: "", startTime: "", endTime: "" };
      if (row.checked) {
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!row.startTime || !row.endTime) {
          toast.error(`Please select start and end times for ${formattedDate}`);
          return;
        }
        let hoursNum = 0;
        if (typeof row.hours === 'string' && row.hours.includes(':')) {
          const parts = row.hours.split(':');
          hoursNum = (parseFloat(parts[0]) || 0) + (parseFloat(parts[1]) || 0) / 60;
        } else {
          hoursNum = parseFloat(row.hours);
        }
        if (isNaN(hoursNum) || hoursNum <= 0) {
          toast.error(`Hours per Day for ${formattedDate} must be a positive number greater than 0`);
          return;
        }
        for (let p = 0; p < (addShiftData.people || 1); p++) {
          schedule.push({
            start_date: DateTime.fromISO(row.startTime, { zone: invoiceTimezone }).toUTC().toISO({ suppressMilliseconds: true }) || row.startTime,
            end_date: DateTime.fromISO(row.endTime, { zone: invoiceTimezone }).toUTC().toISO({ suppressMilliseconds: true }) || row.endTime,
            total_hr: hoursNum
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

  const handleGuardSelect = async (guard: any, rates: { hourlyRate?: number; travelFee?: number; flatQcRate?: number }) => {


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
          toast.error(`Guard ${guard.first_name} is already assigned to shift ${assigned.shift_no} during this time (${new Date(assigned.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(assigned.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`);
          return;
        }
      }
    }

    const newAssignments = { ...pendingAssignments };
    selectedShiftIds.forEach(id => {
      newAssignments[id] = {
        guard_id: guard.guard_id,
        guard_name: `${guard.first_name} ${guard.last_name}`,
        hourlyRate: rates.hourlyRate,
        travelFee: rates.travelFee,
        flatQcRate: rates.flatQcRate,
        type: assignmentType
      };
    });
    setPendingAssignments(newAssignments);
    setIsSelectUserOpen(false);
    setSelectedShiftIds([]);
    toast.success(`Guard ${guard.first_name} ${guard.last_name} selected for ${selectedShiftIds.length} shifts`);
  };

  const handleAssignGuards = async (shiftRates?: any, clearSelection?: () => void) => {
    const leadGroups: Record<string, { guard_id: string; shift_ids: string[]; hourlyRate?: number; travelFee?: number }> = {};
    const standbyGroups: Record<string, { guard_id: string; shift_ids: string[]; flatQcRate?: number }> = {};

    Object.entries(pendingAssignments).forEach(([shiftId, data]) => {
      if (data.type === "standby") {
        const key = `${data.guard_id}_${data.flatQcRate ?? ""}`;
        if (!standbyGroups[key]) {
          standbyGroups[key] = {
            guard_id: data.guard_id,
            shift_ids: [],
            flatQcRate: data.flatQcRate
          };
        }
        standbyGroups[key].shift_ids.push(shiftId);
      } else {
        const key = `${data.guard_id}_${data.hourlyRate ?? ""}_${data.travelFee ?? ""}`;
        if (!leadGroups[key]) {
          leadGroups[key] = {
            guard_id: data.guard_id,
            shift_ids: [],
            hourlyRate: data.hourlyRate,
            travelFee: data.travelFee
          };
        }
        leadGroups[key].shift_ids.push(shiftId);
      }
    });

    const leadAssignments = Object.values(leadGroups).map((group) => {
      const assignment: any = {
        guard_id: group.guard_id,
        shift_ids: group.shift_ids,
      };

      const parsedHourly = Number(group.hourlyRate);
      if (!isNaN(parsedHourly) && parsedHourly >= 1) {
        assignment.per_hour_rate = parsedHourly;
      }

      const parsedTravel = Number(group.travelFee);
      if (!isNaN(parsedTravel) && parsedTravel >= 1) {
        assignment.travel_fee = parsedTravel;
      }

      return assignment;
    });

    const standbyAssignments = Object.values(standbyGroups).map((group) => {
      const assignment: any = {
        guard_id: group.guard_id,
        shift_ids: group.shift_ids
      };
      
      const parsedQcRate = Number(group.flatQcRate);
      if (!isNaN(parsedQcRate) && parsedQcRate > 0) {
        assignment.qc_flat_rate = parsedQcRate;
      }
      
      return assignment;
    });

    if (leadAssignments.length === 0 && standbyAssignments.length === 0) {
      toast.error("Please assign at least one guard");
      return;
    }

    setIsAssigning(true);

    const allAssignmentsForVerify = [
      ...leadAssignments.map((a: any) => ({ guard_id: a.guard_id, shift_ids: a.shift_ids })),
      ...standbyAssignments.map((a: any) => ({ guard_id: a.guard_id, shift_ids: a.shift_ids }))
    ];
    const verifyGroups: Record<string, string[]> = {};
    allAssignmentsForVerify.forEach((a: any) => {
      if (!verifyGroups[a.guard_id]) verifyGroups[a.guard_id] = [];
      verifyGroups[a.guard_id].push(...a.shift_ids);
    });
    
    const verifyPayload = {
      invoice_id: id,
      assignments: Object.entries(verifyGroups).map(([guard_id, shift_ids]) => ({
        guard_id,
        shift_ids: Array.from(new Set(shift_ids))
      }))
    };

    const verifyRes = await verifyGuardAssignmentAction(verifyPayload);
    if (!verifyRes.success) {
      setIsAssigning(false);
      let warnings: string[] = [];
      if (Array.isArray(verifyRes.data)) {
        warnings = verifyRes.data.map(String);
      } else if (verifyRes.error) {
        warnings = [verifyRes.error];
      } else {
        warnings = ["There are scheduling conflicts for the selected guards."];
      }

      setVerifyWarning({
        isOpen: true,
        warnings,
        pendingPayloads: {
          leadAssignments,
          standbyAssignments,
          clearSelection
        }
      });
      return;
    }

    await executeAssignments(leadAssignments, standbyAssignments, clearSelection);
  };

  const executeAssignments = async (leadAssignments: any[], standbyAssignments: any[], clearSelection?: () => void) => {
    setIsAssigning(true);
    let success = true;

    if (leadAssignments.length > 0) {
      const payload: any = { invoice_id: id, assignments: leadAssignments };
      console.log("[executeAssignments] Payload to assignGuardsAction:", JSON.stringify(payload, null, 2));
      const res = await assignGuardsAction(payload);
      if (!res.success) {
        success = false;
        setActionError({isOpen: true, message: res.error || "Failed to assign lead guards"});
      }
    }

    if (standbyAssignments.length > 0) {
      const payload: any = { invoice_id: id, assignments: standbyAssignments };
      console.log("[executeAssignments] Payload to assignStandbyGuardsAction:", JSON.stringify(payload, null, 2));
      const res = await assignStandbyGuardsAction(payload);
      if (!res.success) {
        success = false;
        setActionError({isOpen: true, message: res.error || "Failed to assign standby guards"});
      }
    }

    if (success) {
      toast.success("Guards assigned successfully");
      setPendingAssignments({});
      if (typeof clearSelection === 'function') clearSelection();
      loadShifts("assign_guard");
    }
    
    setIsAssigning(false);
  };

  const handleUnassignGuard = (shiftOfferId: string, type: "lead_guard" | "standby_guard") => setUnassignConfirm({ isOpen: true, shiftOfferId, type });

  const handleConfirmUnassign = async () => {
    if (!unassignConfirm.shiftOfferId) return;
    setIsShiftsLoading(true);
    const res = await unassignGuardAction(unassignConfirm.shiftOfferId, unassignConfirm.type);
    if (res.success) {
      toast.success(res.message || "Guard unassigned successfully");
      await Promise.all([
        loadShifts("assign_guard"),
        loadAvailableGuards()
      ]);
      setUnassignConfirm({ isOpen: false, shiftOfferId: "", type: "lead_guard" });
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
        shippingAddress={invoice.shipping_address}
        onOpenPayment={() => { setIsPaymentOpen(true); setIsScheduleOpen(false); setIsAssignGuardOpen(false); }}
        onOpenShiftDetail={() => { setIsEditOpen(true); }}
        onOpenSchedule={() => { setIsScheduleOpen(true); setIsPaymentOpen(false); setIsAssignGuardOpen(false); setIsAddingShift(false); loadShifts("schedule"); }}
        onOpenAssignGuard={() => {
          const paymentStatus = invoice?.payment_status?.toLowerCase();
          if (!paymentStatus || paymentStatus === 'pending' || paymentStatus === 'unpaid') {
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
        actions={invoice.actions}
        type={invoice.type}
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
          onDuplicate={handleDuplicateShift}
          onEdit={handleEditShift}
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
          onOpenSelectUser={(ids, type) => {
            setSelectedShiftIds(ids);
            setAssignmentType(type);
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
        mode={assignmentType}
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

      <VerifyWarningDialog
        isOpen={verifyWarning.isOpen}
        warnings={verifyWarning.warnings}
        onClose={() => setVerifyWarning({ isOpen: false, warnings: [] })}
        onConfirm={async () => {
          setVerifyWarning(prev => ({ ...prev, isOpen: false }));
          if (verifyWarning.pendingPayloads) {
            await executeAssignments(
              verifyWarning.pendingPayloads.leadAssignments,
              verifyWarning.pendingPayloads.standbyAssignments,
              verifyWarning.pendingPayloads.clearSelection
            );
          }
        }}
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
        isOpen={duplicateConfirm.isOpen}
        onClose={() => setDuplicateConfirm({ isOpen: false, shiftId: "" })}
        onConfirm={handleConfirmDuplicate}
        title="Duplicate Shift?"
        description="Are you sure you want to duplicate this shift schedule?"
        confirmText="Yes, duplicate it"
        isDanger={false}
        isLoading={isShiftsLoading}
      />

      <ConfirmationDialog
        isOpen={unassignConfirm.isOpen}
        onClose={() => setUnassignConfirm({ isOpen: false, shiftOfferId: "", type: "lead_guard" })}
        onConfirm={handleConfirmUnassign}
        title="Unassign Guard?"
        description="This will remove the guard from this shift. Are you sure?"
        confirmText="Yes, unassign"
        isDanger={true}
        isLoading={isShiftsLoading}
      />

      {editingShift && (
        <EditShiftDialog
          isOpen={isEditShiftOpen}
          onClose={() => {
            setIsEditShiftOpen(false);
            setEditingShift(null);
          }}
          onUpdate={handleUpdateShift}
          initialShift={editingShift}
          services={services}
          isSaving={isSavingShift}
          timezone={invoiceTimezone}
        />
      )}

      <ActionErrorDialog 
        isOpen={actionError.isOpen} 
        onClose={() => setActionError({ isOpen: false, message: "" })} 
        message={actionError.message} 
      />
    </div>
  );
}
