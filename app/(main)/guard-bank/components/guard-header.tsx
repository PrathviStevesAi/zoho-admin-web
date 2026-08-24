import Link from "next/link";
import { 
  ChevronRight, 
  ArrowLeft, 
  MoreVertical, 
  ExternalLink, 
  Edit2, 
  Shield, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GuardHeaderProps {
  guard: any;
  isEditing: boolean;
  isSavingEdit: boolean;
  hasChanges: boolean;
  setIsEditing: (val: boolean) => void;
  handleSaveEdit: () => void;
  setIsUpdateLevelModalOpen: (val: boolean) => void;
  setDeleteConfirmOpen: (val: boolean) => void;
  setEditForm: (form: any) => void;
  getTabParam: () => string;
  getStatusBreadcrumb: () => string;
}

export function GuardHeader({
  guard,
  isEditing,
  isSavingEdit,
  hasChanges,
  setIsEditing,
  handleSaveEdit,
  setIsUpdateLevelModalOpen,
  setDeleteConfirmOpen,
  setEditForm,
  getTabParam,
  getStatusBreadcrumb
}: GuardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-slate-700 text-[11px] sm:text-[13px] mb-1">
            <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/guard-bank" className="hover:text-[#0064cb] transition-colors whitespace-nowrap">Guard Bank</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/guard-bank?tab=${getTabParam()}`} className="hover:text-[#0064cb] transition-colors whitespace-nowrap">{getStatusBreadcrumb()}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
            <span className="text-slate-600 font-medium whitespace-nowrap hidden sm:block">Guard Details</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={`/guard-bank?tab=${getTabParam()}`} className="p-1.5 sm:p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
              <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4" />
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">Guard Details</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto mt-1 sm:mt-0">
          {isEditing && (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" className="px-5 py-2 h-10" onClick={() => setIsEditing(false)} disabled={isSavingEdit}>Cancel</Button>
              <Button className="px-5 py-2 h-10" onClick={handleSaveEdit} disabled={isSavingEdit || !hasChanges}>
                {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border-none shadow-sm cursor-pointer">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-slate-100 shadow-xl bg-white text-slate-700 font-medium text-[13px]">
            {guard.action?.is_open_crm && (
              <DropdownMenuItem onClick={() => window.open(`https://crm.zoho.com/crm/org677245190/tab/Vendors/${guard.vendor_id}`, "_blank")} className="cursor-pointer gap-2 py-2.5 focus:bg-slate-50 focus:text-slate-900 rounded-lg text-slate-700">
                <ExternalLink className="w-4 h-4" />
                Open in CRM
              </DropdownMenuItem>
            )}
            {guard.action?.is_edit_application && (
              <DropdownMenuItem onClick={() => { setEditForm({ ...guard }); setIsEditing(true); }} className="cursor-pointer gap-2 py-2.5 focus:bg-slate-50 focus:text-slate-900 rounded-lg text-slate-700">
                <Edit2 className="w-4 h-4" />
                Edit Application
              </DropdownMenuItem>
            )}
            {guard.action?.is_edit_guard_level && (
              <DropdownMenuItem onClick={() => setIsUpdateLevelModalOpen(true)} className="cursor-pointer gap-2 py-2.5 focus:bg-slate-50 focus:text-slate-900 rounded-lg text-slate-700">
                <Shield className="w-4 h-4" />
                Update Level
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="cursor-pointer gap-2 py-2.5 focus:bg-red-50 focus:text-red-600 rounded-lg text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

      {isEditing && (
        <div className="flex sm:hidden items-center justify-center gap-3 w-full mt-2">
          <Button variant="outline" className="flex-1 max-w-[180px] h-10" onClick={() => setIsEditing(false)} disabled={isSavingEdit}>Cancel</Button>
          <Button className="flex-1 max-w-[180px] h-10" onClick={handleSaveEdit} disabled={isSavingEdit || !hasChanges}>
            {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
