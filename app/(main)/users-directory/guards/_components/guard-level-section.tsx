import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const levels = [
  {
    id: 1,
    title: "Level 1 - Entry Level",
    description: "Meets basic requirements. Suitable for entry-level positions.",
    badge: "Basic",
    color: "bg-[#22c55e]",
    textColor: "text-[#22c55e]",
    badgeBg: "bg-[#22c55e]/10",
  },
  {
    id: 2,
    title: "Level 2 - Intermediate",
    description: "Exceeds basic requirements. Professional and reliable.",
    badge: "Professional",
    color: "bg-[#f59e0b]",
    textColor: "text-[#f59e0b]",
    badgeBg: "bg-[#f59e0b]/10",
  },
  {
    id: 3,
    title: "Level 3 - Senior Level",
    description: "Exceeds requirements significantly. Seasoned security professional.",
    badge: "Expert",
    color: "bg-[#a855f7]",
    textColor: "text-[#a855f7]",
    badgeBg: "bg-[#a855f7]/10",
  }
];

export function GuardLevelSection({ formData, setFormData }: any) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col mb-6">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="w-5 h-5 text-[#0064cb]" />
        <h3 className="text-lg font-bold text-slate-900">Select Guard Level <span className="text-red-500">*</span></h3>
      </div>
      <p className="text-sm text-slate-500 mb-6">Choose the appropriate level based on the guard's qualifications and experience.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {levels.map((level) => (
          <div 
            key={level.id} 
            role="radio"
            aria-checked={formData.guardLevel === level.id}
            tabIndex={0}
            onClick={() => setFormData({ ...formData, guardLevel: level.id, guardLevelError: null })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFormData({ ...formData, guardLevel: level.id, guardLevelError: null });
              }
            }}
            className={cn(
              "relative flex flex-col p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 h-full min-w-0",
              formData.guardLevel === level.id ? "border-[#0064cb] bg-[#0064cb]/5 shadow-sm" : "border-slate-200"
            )}
          >
            <div className="flex items-center justify-between mb-4 shrink-0 w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 shrink-0 bg-white">
                  {formData.guardLevel === level.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0064cb]" />
                  )}
                </div>
                <div className={cn("w-7 h-7 shrink-0 flex items-center justify-center", level.textColor)}>
                  <svg className="w-full h-full" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0L0 5V13C0 20 5 26 12 28C19 26 24 20 24 13V5L12 0Z" fill="currentColor"/>
                    <text x="12" y="19" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">{level.id}</text>
                  </svg>
                </div>
              </div>
              <div className={cn("px-3 py-1 rounded-full text-xs font-bold w-fit shrink-0", level.badgeBg, level.textColor)}>
                {level.badge}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-w-0">
              <h4 className="font-bold text-slate-800 mb-1.5 truncate">{level.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed break-words whitespace-normal">{level.description}</p>
            </div>
          </div>
        ))}
      </div>
      {formData.guardLevelError && (
        <p className="text-red-500 text-sm mt-2">{formData.guardLevelError}</p>
      )}
    </div>
  );
}
