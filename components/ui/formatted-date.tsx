import { formatDate } from "@/lib/utils";

interface FormattedDateProps {
  date: string | Date | null | undefined;
  includeTime?: boolean;
  timezone?: string;
  className?: string;
}

export function FormattedDate({ date, includeTime = true, timezone, className = "" }: FormattedDateProps) {
  if (!date) return <span className={className}>-</span>;
  
  return (
    <span className={className}>
      {formatDate(date, includeTime, timezone)}
    </span>
  );
}
