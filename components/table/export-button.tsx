"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/excel-utils";

interface ExportButtonProps {
  data: any[];
  columns: any[];
  fileName: string;
}

export function ExportButton({ data, columns, fileName }: ExportButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all active:scale-95 h-9 w-9"
      onClick={() => exportToExcel(data, columns, fileName)}
      title="Export to Excel"
    >
      <Download className="w-5 h-5" />
    </Button>
  );
}
