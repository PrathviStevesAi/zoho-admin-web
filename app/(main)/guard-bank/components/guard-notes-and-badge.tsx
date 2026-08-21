import { Shield, NotebookText, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuardNotesAndBadgeProps {
  guard: any;
  notes: string;
  setNotes: (val: string) => void;
  handleSaveNotes: () => void;
  isSavingNotes: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  setIsViewModalOpen: (val: boolean) => void;
  handleDeleteBadge: () => void;
}

export function GuardNotesAndBadge({
  guard,
  notes,
  setNotes,
  handleSaveNotes,
  isSavingNotes,
  setIsCreateModalOpen,
  setIsViewModalOpen,
  handleDeleteBadge
}: GuardNotesAndBadgeProps) {
  return (
    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 flex flex-col ${guard.status === 'approved' ? '' : 'lg:col-span-2'}`}>
        <div className="flex items-center gap-2 text-[#0064cb]">
          <NotebookText className="w-4 h-4" />
          <h3 className="font-bold text-slate-800 text-[14px]">Admin Notes</h3>
        </div>
        <div className="space-y-4">
          <textarea
            placeholder="Write your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-slate-200 focus:outline-none focus:border-[#0064cb] p-4 text-[13px] font-medium bg-slate-50"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400">Notes are visible only to admins</span>
            <Button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="bg-[#0064cb] hover:bg-[#0052ae] text-white px-5 rounded-lg h-9 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-200/50 cursor-pointer"
            >
              {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <NotebookText className="w-3.5 h-3.5" />}
              Save Note
            </Button>
          </div>
        </div>
      </div>

      {guard.status === 'approved' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0064cb]">
              <Shield className="w-4 h-4" />
              <h3 className="font-bold text-slate-800 text-[14px] uppercase">Fast Guard Badge ID</h3>
            </div>
            {!guard.guard_badge_url && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#0064cb] hover:bg-[#0052ae] text-white text-[11px] font-bold px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer border-none shadow-sm shadow-blue-200/50">
                <Plus className="w-3.5 h-3.5" />
                Create Badge ID
              </Button>
            )}
          </div>

          {!guard.guard_badge_url ? (
            <div className="text-center py-8 text-slate-400 font-medium text-[12px] bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              Badge ID not available<br /><span className="text-[10px] mt-1 block">Create a badge ID for this guard.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div onClick={() => setIsViewModalOpen(true)} className="cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50/70 hover:shadow-md transition-all hover:bg-slate-50 w-full flex justify-center">
                <img src={guard.guard_badge_url} alt="Guard Badge ID" className="w-40 h-auto rounded-lg object-contain border border-slate-200 shadow-sm bg-white" />
              </div>
              <Button onClick={handleDeleteBadge} variant="outline" className="mt-4 border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-bold h-9 px-6 rounded-lg flex items-center gap-1.5 cursor-pointer w-full max-w-[200px]">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Badge
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
