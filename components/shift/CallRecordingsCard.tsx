import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Activity, X } from "lucide-react";
import { Shift } from "./types";

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();

  const time = d.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${day} ${month} ${year} ${time}`;
};

const handleDownloadRecording = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "recording.mp3";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Failed to download recording:", error);
    window.open(url, "_blank");
  }
};

interface CallRecordingsCardProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
}

export function CallRecordingsCard({ isOpen, onClose, shift }: CallRecordingsCardProps) {
  if (!isOpen || !shift) return null;

  const recordings = shift.shift_voice_calls || [];

  return (
    <Card className="mb-6 p-0 border-0 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white animate-in slide-in-from-top-4 duration-500 fade-in">
      <div className="p-5 sm:p-6 pb-4 border-b bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#0064cb]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Call Recordings</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              View and listen to all recorded calls between customers, guards and FastGuard staff.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full h-8 w-8"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-0">
        <div className="bg-white overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">#</th>
                  <th className="px-6 py-4 whitespace-nowrap">Call Type</th>
                  <th className="px-6 py-4 whitespace-nowrap">Caller Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Receiver Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Call Date & Time</th>
                  <th className="px-6 py-4 whitespace-nowrap">Duration</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No call recordings found.
                    </td>
                  </tr>
                ) : (
                  recordings.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{idx + 1}</td>
                      <td className="px-6 py-4 text-slate-600">{rec.call_type || "-"}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{rec.call_by || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{rec.call_to || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {rec.call_time ? formatDateTime(rec.call_time) : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{rec.duration || "-"}</td>
                      <td className="px-6 py-4">
                        {rec.status === "connected" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                            {rec.status || "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 rounded-md"
                            disabled={!rec.recording_url}
                            onClick={() => {
                              if (rec.recording_url) {
                                window.open(rec.recording_url, "_blank");
                              }
                            }}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 rounded-md"
                            disabled={!rec.recording_url}
                            onClick={() => {
                              if (rec.recording_url) {
                                const filename = `Call_Recording_${rec.call_by}_${rec.call_to}_${rec.id.substring(0, 6)}.mp3`;
                                handleDownloadRecording(rec.recording_url, filename);
                              }
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
