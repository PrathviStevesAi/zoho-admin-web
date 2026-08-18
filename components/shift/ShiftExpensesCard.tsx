"use client";

import { useState, useEffect } from "react";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Shift } from "./types";

interface ShiftExpensesCardProps {
  shift: Shift | null;
  isSavingDetails: boolean;
  isLoading?: boolean;
  onSaveDetails: (payload: any) => Promise<void>;
}

export function ShiftExpensesCard({
  shift,
  isSavingDetails,
  isLoading,
  onSaveDetails,
}: ShiftExpensesCardProps) {
  type EditingField = "per_hour_rate" | "qc_flat_rate" | null;
  const [editingField, setEditingField] = useState<EditingField>(null);

  const [editDetailsForm, setEditDetailsForm] = useState({
    per_hour_rate: "",
    qc_flat_rate: "",
  });

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState([{ key: "", value: "" }]);
  const [otherExpenses, setOtherExpenses] = useState<{ key: string; value: number }[]>([]);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);
  const [editingExpenseData, setEditingExpenseData] = useState<{ key: string; value: string }>({ key: "", value: "" });
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  useEffect(() => {
    if (shift) {
      setEditDetailsForm({
        per_hour_rate:
          shift.per_hour_rate !== null && shift.per_hour_rate !== undefined
            ? String(shift.per_hour_rate)
            : "",
        qc_flat_rate:
          shift.qc_flat_rate !== null && shift.qc_flat_rate !== undefined
            ? String(shift.qc_flat_rate)
            : "",
      });
      if ((shift as any).other_expenses && Object.keys((shift as any).other_expenses).length > 0) {
        const expensesObj = (shift as any).other_expenses;
        const expensesArr = Object.entries(expensesObj).map(([key, value]) => ({
          key,
          value: Number(value)
        }));
        setOtherExpenses(expensesArr);
      } else {
        setOtherExpenses([]);
      }
    }
  }, [shift]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-1" />
                <div className="h-3 w-48 bg-slate-100/80 rounded" />
              </div>
            </div>
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50/50">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-1" />
                <div className="h-3 w-48 bg-slate-100/80 rounded" />
              </div>
              <div className="h-9 w-32 bg-slate-200 rounded-lg" />
            </div>
            <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col relative">
              <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 py-3 bg-slate-50/90 border-b border-slate-100">
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded mx-auto" />
              </div>
              <div className="grid grid-cols-[1fr_120px_100px] gap-4 items-center p-4 border-b border-slate-100 bg-white">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="flex justify-center gap-2">
                  <div className="h-7 w-7 bg-slate-200 rounded-full" />
                  <div className="h-7 w-7 bg-slate-200 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_120px_100px] gap-4 items-center p-4 border-b border-slate-100 bg-white">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="flex justify-center gap-2">
                  <div className="h-7 w-7 bg-slate-200 rounded-full" />
                  <div className="h-7 w-7 bg-slate-200 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_120px_100px] gap-4 items-center p-4 bg-slate-50/90 border-t border-slate-100">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shift) return null;

  const formatPrice = (val: any) => {
    if (val === null || val === undefined || val === "") return "----";
    const num = Number(val);
    if (isNaN(num)) return "----";
    return `$${num.toFixed(2)}`;
  };

  const handleSaveField = async (field: Exclude<EditingField, null>) => {
    const payload: any = {};
    let dirty = false;

    switch (field) {
      case "per_hour_rate":
        const initialPerHourRate =
          shift.per_hour_rate !== null && shift.per_hour_rate !== undefined
            ? String(shift.per_hour_rate)
            : "";
        if (editDetailsForm.per_hour_rate !== initialPerHourRate) {
          payload.per_hour_rate =
            editDetailsForm.per_hour_rate === "" ? 0 : Number(editDetailsForm.per_hour_rate);
          dirty = true;
        }
        break;
      case "qc_flat_rate":
        const initialQcFlatRate =
          shift.qc_flat_rate !== null && shift.qc_flat_rate !== undefined
            ? String(shift.qc_flat_rate)
            : "";
        if (editDetailsForm.qc_flat_rate !== initialQcFlatRate) {
          payload.qc_flat_rate =
            editDetailsForm.qc_flat_rate === "" ? 0 : Number(editDetailsForm.qc_flat_rate);
          dirty = true;
        }
        break;
    }

    if (!dirty) {
      setEditingField(null);
      return;
    }

    await onSaveDetails(payload);
    setEditingField(null);
  };

  const renderEditButtons = (field: Exclude<EditingField, null>, onCancel: () => void) => {
    return (
      <div className="flex items-center gap-2 mt-2 self-end">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-3 h-8 rounded-lg font-bold border-slate-200 text-[10px] text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSaveField(field)}
          disabled={isSavingDetails}
          className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-3 h-8 rounded-lg font-bold text-[10px] shadow-md shadow-blue-100 transition-all active:scale-95 flex gap-1.5 cursor-pointer"
        >
          {isSavingDetails ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </Button>
      </div>
    );
  };

  const renderEditIcon = (
    field: Exclude<EditingField, null>,
    isAllowed: boolean,
    isDisabled?: boolean,
    disabledTooltip?: string
  ) => {
    const isEffectivelyDisabled = !isAllowed || isDisabled;
    const tooltipText = !isAllowed
      ? "Once a shift is execute, its details cannot be updated."
      : isDisabled
        ? disabledTooltip
        : `Edit ${field.replace(/_/g, " ")}`;

    return (
      <div
        title={tooltipText}
        className={cn("inline-block ml-2", isEffectivelyDisabled && "cursor-not-allowed")}
      >
        <Button
          variant="outline"
          size="icon"
          disabled={isEffectivelyDisabled}
          onClick={() => !isEffectivelyDisabled && setEditingField(field)}
          className={cn(
            "h-7 w-7 rounded-lg shrink-0 transition-all",
            isEffectivelyDisabled
              ? "text-slate-400 bg-slate-50 border-slate-200 pointer-events-none"
              : "text-slate-400 hover:text-[#0064cb] bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
          )}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  const handleAddAnother = () => {
    setPendingExpenses([...pendingExpenses, { key: "", value: "" }]);
  };

  const handleSaveExpenses = async () => {
    const validExpenses = pendingExpenses
      .filter((e) => e.key.trim() !== "" && e.value !== "")
      .map((e) => ({ key: e.key.trim(), value: Number(e.value) }))
      .filter((e) => !isNaN(e.value));

    if (validExpenses.length > 0) {
      const updatedExpenses = [...otherExpenses, ...validExpenses];

      const payloadObj: Record<string, number> = {};
      updatedExpenses.forEach((e) => {
        payloadObj[e.key] = e.value;
      });

      await onSaveDetails({ other_expenses: payloadObj });
      setOtherExpenses(updatedExpenses);
    }

    setPendingExpenses([{ key: "", value: "" }]);
    setIsAddingExpense(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[12px] font-bold text-[#0064cb] uppercase tracking-widest pl-1">
        EXPENSES
      </h3>
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Rate Details</h4>
              <p className="text-xs text-slate-500 mt-0.5">Configured rates for this shift.</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              {editingField === "per_hour_rate" ? (
                <div className="w-full flex flex-col gap-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    Hourly Rate Paid to Guard
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editDetailsForm.per_hour_rate}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      if (Number(e.target.value) < 0) return;
                      setEditDetailsForm((prev) => ({ ...prev, per_hour_rate: e.target.value }));
                    }}
                    className="h-10 bg-white border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                  />
                  {renderEditButtons("per_hour_rate", () => {
                    setEditDetailsForm((prev) => ({
                      ...prev,
                      per_hour_rate:
                        shift.per_hour_rate !== null && shift.per_hour_rate !== undefined
                          ? String(shift.per_hour_rate)
                          : "",
                    }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    HOURLY RATE PAID TO GUARD
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(shift.per_hour_rate)}{" "}
                      <span className="text-slate-500 font-medium">/ hour</span>
                    </span>
                    {renderEditIcon("per_hour_rate", !!shift.action?.is_hourly_rate_edit)}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50">
              {editingField === "qc_flat_rate" ? (
                <div className="w-full flex flex-col gap-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    Flat QC Rate Paid to Guard
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editDetailsForm.qc_flat_rate}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      if (Number(e.target.value) < 0) return;
                      setEditDetailsForm((prev) => ({ ...prev, qc_flat_rate: e.target.value }));
                    }}
                    className="h-10 bg-white border-slate-200 focus:bg-white focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                  />
                  {renderEditButtons("qc_flat_rate", () => {
                    setEditDetailsForm((prev) => ({
                      ...prev,
                      qc_flat_rate:
                        shift.qc_flat_rate !== null && shift.qc_flat_rate !== undefined
                          ? String(shift.qc_flat_rate)
                          : "",
                    }));
                    setEditingField(null);
                  })}
                </div>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    FLAT QC RATE PAID TO GUARD
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(shift.qc_flat_rate)}
                    </span>
                    {renderEditIcon("qc_flat_rate", !!shift.action?.is_qc_flat_rate_edit)}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900">OTHER EXPENSES</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Add any additional expenses related to this shift.
              </p>
            </div>
            {!isAddingExpense && (
              <Button
                variant="outline"
                className="h-9 rounded-lg font-bold text-xs text-[#0064cb] border-blue-100 hover:bg-blue-50/50 flex gap-1.5 transition-colors cursor-pointer"
                onClick={() => setIsAddingExpense(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Other Expense
              </Button>
            )}
          </div>

          {otherExpenses.length > 0 && (
            <div className="mb-6">
              <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col relative">
                <div className={cn("overflow-y-auto", otherExpenses.length > 4 && "max-h-[380px]")}>
                  <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 py-3 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
                    <span className="text-[12px] font-bold text-slate-500 tracking-widest">Key</span>
                    <span className="text-[12px] font-bold text-slate-500 tracking-widest">Value (USD)</span>
                    <span className="text-[12px] font-bold text-slate-500 tracking-widest text-center">Actions</span>
                  </div>
                  {otherExpenses.map((expense, idx) => {
                    const isEditing = editingExpenseIndex === idx;
                    const isDataChanged = isEditing && (editingExpenseData.key !== expense.key || editingExpenseData.value !== expense.value.toString());

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-[1fr_120px_100px] gap-4 items-center p-4 border-b border-slate-100 bg-white"
                      >
                        {isEditing ? (
                          <>
                            <Input
                              value={editingExpenseData.key}
                              onChange={(e) => setEditingExpenseData(prev => ({ ...prev, key: e.target.value }))}
                              className="h-10 bg-white border-slate-200 focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-md text-sm text-slate-800"
                            />
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center justify-center w-8 border-r border-slate-200 bg-slate-100 rounded-l-md">
                                <span className="text-slate-600 font-bold text-sm">$</span>
                              </div>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingExpenseData.value}
                                onKeyDown={(e) => {
                                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  if (Number(e.target.value) < 0) return;
                                  setEditingExpenseData((prev) => ({ ...prev, value: e.target.value }));
                                }}
                                className="h-10 bg-white border-slate-200 focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-md text-sm text-slate-800 pl-10"
                              />
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingExpenseIndex(null)}
                                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 border-slate-200 shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button
                                disabled={!isDataChanged || isSavingDetails || !editingExpenseData.key.trim() || !editingExpenseData.value}
                                onClick={async () => {
                                  const updated = [...otherExpenses];
                                  updated[idx] = { key: editingExpenseData.key.trim(), value: Number(editingExpenseData.value) };

                                  const payloadObj: Record<string, number> = {};
                                  updated.forEach((e) => {
                                    payloadObj[e.key] = e.value;
                                  });
                                  await onSaveDetails({ other_expenses: payloadObj });

                                  setOtherExpenses(updated);
                                  setEditingExpenseIndex(null);
                                }}
                                className="h-8 px-2 text-xs rounded-md font-medium bg-[#0064cb] hover:bg-[#0052ae] text-white disabled:opacity-50 flex-1"
                              >
                                {isSavingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-semibold text-slate-700 truncate">{expense.key}</span>
                            <span className="text-sm font-bold text-slate-900">
                              ${expense.value.toFixed(2)}
                            </span>
                            <div className="flex items-center justify-center gap-2">
                              {!!shift.action?.is_other_expenses_edit && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full text-slate-400 hover:text-[#0064cb] border-slate-200 shrink-0"
                                    onClick={() => {
                                      setEditingExpenseIndex(idx);
                                      setEditingExpenseData({ key: expense.key, value: expense.value.toString() });
                                    }}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full text-slate-400 hover:text-red-500 border-slate-200 shrink-0"
                                    onClick={() => setDeleteConfirmIndex(idx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[1fr_120px_100px] gap-4 items-center p-4 bg-slate-50/90 backdrop-blur-sm border-t border-slate-100 sticky bottom-0 z-10">
                    <span className="text-sm font-bold text-slate-900">Total Other Expenses</span>
                    <span className="text-sm font-bold text-slate-900">
                      ${otherExpenses.reduce((acc, curr) => acc + curr.value, 0).toFixed(2)}
                    </span>
                    <div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAddingExpense && (
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 mb-2">
              <h5 className="text-sm font-bold text-slate-900 mb-1">Expense Details</h5>
              <p className="text-xs text-slate-500 mb-4">Enter expense information below.</p>

              <div className="space-y-4 max-h-[360px] overflow-y-auto overflow-x-hidden pr-2 py-1">
                {pendingExpenses.map((pending, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative bg-white p-4 border border-slate-100 rounded-lg shadow-sm">
                    {pendingExpenses.length > 1 && (
                      <div className="absolute right-2 top-2 z-10">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const updated = [...pendingExpenses];
                            updated.splice(idx, 1);
                            setPendingExpenses(updated);
                          }}
                          className="h-6 w-6 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 bg-white border-slate-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 flex gap-1">
                        Expense Key <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Fuel Surcharge, Equipment Rental"
                        value={pending.key}
                        onChange={(e) => {
                          const updated = [...pendingExpenses];
                          updated[idx].key = e.target.value;
                          setPendingExpenses(updated);
                        }}
                        className="h-10 bg-white border-slate-200 focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800"
                      />
                      {idx === pendingExpenses.length - 1 && (
                        <p className="text-[10px] text-slate-500 mt-1">Enter a short name for this expense.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 flex gap-1">
                        Expense Value (USD) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10 border-r border-slate-200 bg-slate-100 rounded-l-lg">
                          <span className="text-slate-600 font-bold text-sm">$</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={pending.value}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            if (Number(e.target.value) < 0) return;
                            const updated = [...pendingExpenses];
                            updated[idx].value = e.target.value;
                            setPendingExpenses(updated);
                          }}
                          className="h-10 bg-white border-slate-200 focus:ring-[#0064cb]/5 focus:border-[#0064cb] rounded-lg text-sm text-slate-800 pl-12"
                        />
                      </div>
                      {idx === pendingExpenses.length - 1 && (
                        <p className="text-[10px] text-slate-500 mt-1">Enter the amount in USD.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-3">
                <Button
                  variant="ghost"
                  onClick={handleAddAnother}
                  disabled={!pendingExpenses[pendingExpenses.length - 1].key.trim() || !pendingExpenses[pendingExpenses.length - 1].value}
                  className="px-3 h-8 rounded-lg font-bold text-[#0064cb] hover:bg-blue-50 text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex gap-1.5 items-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another
                </Button>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setPendingExpenses([{ key: "", value: "" }]);
                  }}
                  className="px-4 h-9 rounded-lg font-bold border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveExpenses}
                  disabled={isSavingDetails || pendingExpenses.every(e => !e.key.trim() || !e.value)}
                  className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-4 h-9 rounded-lg font-bold text-xs shadow-md shadow-blue-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDetails ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Save Expense
                </Button>
              </div>
            </div>
          )}

          {!isAddingExpense && otherExpenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <h5 className="text-base font-bold text-slate-900 mb-1">
                No other expenses added yet.
              </h5>
              <p className="text-sm text-slate-500 font-medium">
                Click "Add Other Expense" to add additional costs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmIndex !== null} onOpenChange={(open) => {
        if (!open && !isDeletingExpense) setDeleteConfirmIndex(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmIndex(null)}
              disabled={isDeletingExpense}
              className="h-9 font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (deleteConfirmIndex === null) return;
                setIsDeletingExpense(true);
                try {
                  const updated = otherExpenses.filter((_, i) => i !== deleteConfirmIndex);

                  const payloadObj: Record<string, number> = {};
                  updated.forEach((e) => {
                    payloadObj[e.key] = e.value;
                  });
                  await onSaveDetails({ other_expenses: payloadObj });

                  setOtherExpenses(updated);
                } finally {
                  setIsDeletingExpense(false);
                  setDeleteConfirmIndex(null);
                }
              }}
              disabled={isDeletingExpense}
              className="h-9 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
            >
              {isDeletingExpense ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
