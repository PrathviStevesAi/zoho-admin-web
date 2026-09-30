"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchMembershipByIdAction,
  fetchMembershipsAction,
  fetchMembershipGuardsAction,
  removeGuardFromMembershipAction,
  removeGuardsFromMembershipAction,
  generateBenefitImageUploadUrlAction,
  uploadGuardQrAction,
  MembershipBenefitItem,
  MembershipAssignedGuardItem,
} from "@/actions/membership.actions";
import useDebounceValue from "@/hooks/use-debounce";
import { ConfirmationDialog } from "@/app/(main)/guard-bank/components/confirmation-dialog";
import { BenefitOverviewCard } from "./_components/benefit-overview-card";
import { AssignedGuardsCard } from "./_components/assigned-guards-card";
import { AssignGuardsDialog } from "./_components/assign-guards-dialog";
import { QrPreviewDialog } from "./_components/qr-preview-dialog";

export default function MembershipDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.id as string;

  // Benefit Details State
  const [benefit, setBenefit] = useState<MembershipBenefitItem | null>(null);
  const [isLoadingBenefit, setIsLoadingBenefit] = useState(true);

  // Assigned Guards State
  const [assignedGuards, setAssignedGuards] = useState<MembershipAssignedGuardItem[]>([]);
  const [isLoadingAssignedGuards, setIsLoadingAssignedGuards] = useState(true);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [assignedStatus, setAssignedStatus] = useState<string>("all_guards");
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize] = useState(10);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const debouncedAssignedSearch = useDebounceValue(assignedSearch, 400);

  // Modals State
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [uploadingQrGuardId, setUploadingQrGuardId] = useState<string | null>(null);

  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    url: string | null;
    guardName: string;
  }>({
    isOpen: false,
    url: null,
    guardName: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    guardIds: string[];
    guardName: string;
    action: "remove_guard" | "remove_qr";
    title: string;
    description: string;
  }>({
    isOpen: false,
    guardIds: [],
    guardName: "",
    action: "remove_guard",
    title: "",
    description: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Benefit Details
  const loadBenefitDetails = useCallback(async () => {
    if (!membershipId) {
      setIsLoadingBenefit(false);
      return;
    }
    setIsLoadingBenefit(true);
    try {
      const res = await fetchMembershipByIdAction(membershipId);
      if (res.success && res.data && (res.data.id || res.data.benefit_name)) {
        setBenefit(res.data);
      } else {
        const listRes = await fetchMembershipsAction();
        if (listRes.success && Array.isArray(listRes.data)) {
          const found = listRes.data.find(
            (b: any) => b.id === membershipId || b.membership_id === membershipId
          );
          if (found) {
            setBenefit(found);
            return;
          }
        }
        if (res.error) {
          toast.error(res.error);
        }
      }
    } catch (err: unknown) {
      try {
        const listRes = await fetchMembershipsAction();
        if (listRes.success && Array.isArray(listRes.data)) {
          const found = listRes.data.find(
            (b: any) => b.id === membershipId || b.membership_id === membershipId
          );
          if (found) {
            setBenefit(found);
            return;
          }
        }
      } catch { }
      const msg = err instanceof Error ? err.message : "Error fetching benefit details";
      toast.error(msg);
    } finally {
      setIsLoadingBenefit(false);
    }
  }, [membershipId]);

  // Load Assigned Guards
  const loadAssignedGuards = useCallback(async () => {
    if (!membershipId) {
      setIsLoadingAssignedGuards(false);
      return;
    }
    setIsLoadingAssignedGuards(true);
    try {
      const res = await fetchMembershipGuardsAction(membershipId, {
        search: debouncedAssignedSearch,
        status: assignedStatus === "all_guards" ? "" : assignedStatus,
        page: assignedPage,
        page_size: assignedPageSize,
      });
      if (res.success && Array.isArray(res.data)) {
        setAssignedGuards(res.data);
        setAssignedTotal(res.total ?? res.data.length);
      } else {
        setAssignedGuards([]);
        setAssignedTotal(0);
      }
    } catch {
      setAssignedGuards([]);
      setAssignedTotal(0);
    } finally {
      setIsLoadingAssignedGuards(false);
    }
  }, [membershipId, debouncedAssignedSearch, assignedStatus, assignedPage, assignedPageSize]);

  useEffect(() => {
    loadBenefitDetails();
  }, [loadBenefitDetails]);

  useEffect(() => {
    loadAssignedGuards();
  }, [loadAssignedGuards]);

  // Delete Action (Guard or QR)
  const handleConfirmDelete = async () => {
    if (!membershipId || confirmModal.guardIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await removeGuardsFromMembershipAction(
        membershipId,
        confirmModal.guardIds,
        confirmModal.action
      );
      if (res.success) {
        toast.success(
          res.message ||
          (confirmModal.action === "remove_guard"
            ? confirmModal.guardIds.length > 1
              ? "Guards removed successfully"
              : "Guard removed successfully"
            : confirmModal.guardIds.length > 1
              ? "QR codes removed successfully"
              : "QR code removed successfully")
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false, guardIds: [] }));
        await Promise.all([loadBenefitDetails(), loadAssignedGuards()]);
      } else {
        toast.error(res.error || "Failed to perform delete");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error performing delete";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload Guard QR
  const handleUploadGuardQr = async (guardId: string, file: File) => {
    if (!membershipId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    setUploadingQrGuardId(guardId);
    try {
      const folderName = benefit?.benefit_name || "benefits";
      const res = await generateBenefitImageUploadUrlAction({
        file_name: file.name,
        type: "benefit",
        folder_name: folderName,
        guard_id: guardId,
      });
      if (!res.success || !res.data?.signed_url) {
        throw new Error(res.error || "Failed to generate upload URL");
      }
      const signedUrl = res.data.signed_url;
      const finalUrl = signedUrl || res.data.public_url || res.data.file_path;

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image to server");

      const updateRes = await uploadGuardQrAction(membershipId, guardId, finalUrl);
      if (updateRes.success) {
        toast.success(updateRes.message || "QR code uploaded successfully");
        await Promise.all([loadBenefitDetails(), loadAssignedGuards()]);
      } else {
        toast.error(updateRes.error || "Failed to save uploaded QR code");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading QR code";
      toast.error(msg);
    } finally {
      setUploadingQrGuardId(null);
    }
  };

  // Loading State Skeleton
  if (isLoadingBenefit) {
    return (
      <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
            <Skeleton className="h-4 w-20" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Skeleton className="h-4 w-28" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="w-full h-[280px] rounded-2xl" />
          <Skeleton className="w-full h-[480px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!benefit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Gift className="w-12 h-12 text-slate-300" />
        <p className="text-slate-600 font-medium">Membership benefit not found.</p>
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
          onClick={() => router.push("/membership")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Membership List
        </Button>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Breadcrumb & Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700">User Management</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href="/membership"
            className="text-slate-600 hover:text-[#0064cb] font-medium transition-colors"
          >
            Membership
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium truncate max-w-[220px]">
            {benefit.benefit_name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/membership"
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{benefit.benefit_name}</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Benefit details & guard assignment
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push("/membership")}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-10 px-4 cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Benefits
          </Button>
        </div>
      </div>

      {/* Main Content: Benefit Overview Card & Assigned Guards Card */}
      <div className="space-y-6">
        <BenefitOverviewCard
          benefit={benefit}
          membershipId={membershipId}
          onRefresh={loadBenefitDetails}
        />

        <AssignedGuardsCard
          assignedGuards={assignedGuards}
          isLoading={isLoadingAssignedGuards}
          assignedSearch={assignedSearch}
          onSearchChange={(val) => {
            setAssignedSearch(val);
            setAssignedPage(1);
          }}
          assignedStatus={assignedStatus}
          onStatusChange={(val) => {
            setAssignedStatus(val);
            setAssignedPage(1);
          }}
          assignedPage={assignedPage}
          onPageChange={setAssignedPage}
          assignedPageSize={assignedPageSize}
          assignedTotal={assignedTotal}
          onOpenAssignGuards={() => setIsAssignDialogOpen(true)}
          onViewQr={(url, guardName) =>
            setQrModal({
              isOpen: true,
              url,
              guardName,
            })
          }
          onUploadQr={handleUploadGuardQr}
          onRemoveQr={(guardId, guardName) =>
            setConfirmModal({
              isOpen: true,
              guardIds: [guardId],
              guardName,
              action: "remove_qr",
              title: "Remove QR Code",
              description: `Are you sure you want to remove the QR code for ${guardName}?`,
            })
          }
          onRemoveGuard={(guardId, guardName) =>
            setConfirmModal({
              isOpen: true,
              guardIds: [guardId],
              guardName,
              action: "remove_guard",
              title: "Remove Guard",
              description: `Are you sure you want to remove ${guardName} from this membership benefit?`,
            })
          }
          onRemoveMultipleGuards={(guardIds, countLabel) =>
            setConfirmModal({
              isOpen: true,
              guardIds,
              guardName: countLabel || `${guardIds.length} guards`,
              action: "remove_guard",
              title: "Remove Assigned Guards",
              description: `Are you sure you want to remove ${countLabel || `all ${guardIds.length} guards`} from this membership benefit?`,
            })
          }
          onRemoveMultipleQrs={(guardIds, countLabel) =>
            setConfirmModal({
              isOpen: true,
              guardIds,
              guardName: countLabel || `${guardIds.length} guards`,
              action: "remove_qr",
              title: "Remove QR Codes",
              description: `Are you sure you want to remove QR codes for ${countLabel || `all ${guardIds.length} guards`}?`,
            })
          }
          uploadingQrGuardId={uploadingQrGuardId}
        />

        {/* Assign Guards Dialog Modal */}
        <AssignGuardsDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          membershipId={membershipId}
          onSuccess={async () => {
            await Promise.all([loadBenefitDetails(), loadAssignedGuards()]);
          }}
        />

        {/* QR Preview Dialog Modal */}
        <QrPreviewDialog
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal((prev) => ({ ...prev, isOpen: false }))}
          url={qrModal.url}
          guardName={qrModal.guardName}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmModal.isOpen}
          onClose={() => {
            if (!isDeleting) {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
          onConfirm={handleConfirmDelete}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText="Delete"
          cancelText="Cancel"
          isDanger={true}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
