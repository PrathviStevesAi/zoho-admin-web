import { useState, useRef } from "react";
import { UserPlus, Paperclip, Loader2, Send, XCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Comment, PreviewFile } from "../types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getCommentAuthorName, formatDateTime, FileAttachmentCard } from "../utils";

interface ShiftCommentsTabProps {
  comments: Comment[];
  isCommentsLoading: boolean;
  commentsError: string | null;
  onCommentSubmit: (text: string, type: "external" | "internal", file: File | null) => Promise<boolean>;
  setPreviewFile: (file: PreviewFile | null) => void;
}

export function ShiftCommentsTab({
  comments,
  isCommentsLoading,
  commentsError,
  onCommentSubmit,
  setPreviewFile,
}: ShiftCommentsTabProps) {
  const [commentType, setCommentType] = useState<"external" | "internal">("external");
  const [commentText, setCommentText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!commentText.trim() && !attachedFile) return;
    setIsSubmitting(true);
    const success = await onCommentSubmit(commentText, commentType, attachedFile);
    if (success) {
      setCommentText("");
      setAttachedFile(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">General comments</h3>
      </div>

      {isCommentsLoading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 bg-slate-200 rounded w-20" />
                  <div className="h-3 bg-slate-100/80 rounded w-16" />
                </div>
                <div className="h-12 bg-slate-50 border border-slate-100 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : commentsError ? (
        <div className="p-8 text-center text-red-500 font-medium text-xs">
          {commentsError}
        </div>
      ) : comments.length === 0 ? (
        <div className="p-4 text-center text-slate-700 font-medium text-xs">
          No comments yet. Write one below!
        </div>
      ) : (
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment: any) => {
            const authorName = getCommentAuthorName(comment);
            const isExternal = comment.type === "external";
            return (
              <div key={comment.id} className="flex gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                    isExternal ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-600"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-800">{authorName}</span>
                    <span className="text-[11px] text-slate-700">{formatDateTime(comment.created_at)}</span>
                    {!isExternal && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center cursor-help">
                            <Lock className="w-3.5 h-3.5 text-black" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          This message only visible to admin/member
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {comment.user_message && (
                    <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                      {comment.user_message}
                    </p>
                  )}
                  {comment.attach_file_url && (
                    <FileAttachmentCard
                      url={comment.attach_file_url}
                      label="Attachment"
                      fallbackName="Attachment"
                      onPreview={(url, title, contentType) => setPreviewFile({ url, title, contentType })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-6 flex flex-col md:flex-row gap-3 items-start">
        <div className="w-full md:w-28 flex-shrink-0 relative">
          <span className="absolute -top-2 left-3 px-1.5 bg-white text-[10px] font-bold text-slate-700 uppercase z-10">
            Type
          </span>
          <Select value={commentType} onValueChange={(val: "internal" | "external") => setCommentType(val)}>
            <SelectTrigger className="!h-14 bg-white border-slate-200 rounded-lg text-[13px] text-slate-600 focus:ring-[#0064cb]/10 focus:border-[#0064cb] cursor-pointer shadow-sm px-4">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)] rounded-lg border-slate-200 shadow-lg p-1 bg-white">
              <SelectItem value="internal" className="text-[13px] cursor-pointer rounded-md hover:bg-slate-50">
                Internal
              </SelectItem>
              <SelectItem value="external" className="text-[13px] cursor-pointer rounded-md hover:bg-slate-50">
                External
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-0 relative w-full">
          <span className="absolute -top-2 left-4 px-1.5 bg-white text-[10px] font-bold text-slate-700 uppercase z-10">
            Comment
          </span>
          <div className="border border-slate-200 rounded-lg bg-white focus-within:border-[#0064cb] focus-within:ring-4 focus-within:ring-[#0064cb]/5 transition-all p-1.5 pl-3 flex flex-col gap-1.5 shadow-sm min-h-[56px] justify-center">
            {attachedFile && (
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl w-fit max-w-full">
                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[180px]">
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-700 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                  title="Remove file"
                >
                  <XCircle className="cursor-pointer w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error("File size must be less than 50MB");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        return;
                      }
                      setAttachedFile(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-slate-50 text-[#0064cb] transition-colors cursor-pointer group disabled:opacity-50 flex-shrink-0 border-none bg-transparent"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <textarea
                className="flex-1 bg-transparent border-none focus:outline-none outline-none focus:ring-0 p-1 text-[13px] text-slate-700 placeholder:text-slate-700 resize-none py-1.5 min-h-[36px] max-h-[120px] custom-scrollbar"
                placeholder="Write comment..."
                rows={1}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!commentText.trim() && !attachedFile)}
                className="bg-[#0064cb] hover:bg-[#0052ae] text-white h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-200/50 flex-shrink-0 p-0"
                title="Send comment"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
