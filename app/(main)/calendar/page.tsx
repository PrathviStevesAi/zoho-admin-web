"use client";

import React, { useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCalendarShiftsAction } from "@/actions/dashboard.actions";
import "./calendar.css";

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [currentDate, setCurrentDate] = useState("");
  const [showFullDuration, setShowFullDuration] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showMoreModal, setShowMoreModal] = useState<{ date: Date; events: any[] } | null>(null);
  const [totalShifts, setTotalShifts] = useState<number | null>(null);

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    updateCurrentDate(calendarApi);
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    updateCurrentDate(calendarApi);
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    updateCurrentDate(calendarApi);
  };

  const changeView = (viewName: string) => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView(viewName);
    setCurrentView(viewName);
    updateCurrentDate(calendarApi);
  };

  const updateCurrentDate = (calendarApi: any) => {
    if (calendarApi) {
      setCurrentDate(calendarApi.view.title);
    }
  };

  const fetchEvents = useCallback(async (fetchInfo: any, successCallback: any, failureCallback: any) => {
    try {
      const from_date = fetchInfo.start.toISOString().split("T")[0];
      const to_date = fetchInfo.end.toISOString().split("T")[0];

      const res = await fetchCalendarShiftsAction(from_date, to_date);
      if (res.success && res.data) {
        const events = res.data.map((shift) => {
          let bgColor = "#9ca3af";
          if (shift.status === "shift_planned") bgColor = "#f59e0b";
          else if (shift.status === "shift_accepted") bgColor = "#3b82f6";
          else if (
            shift.status === "shift_arrival" ||
            shift.status === "shift_pre_check_in" ||
            shift.status === "shift_in_progress" ||
            shift.status === "shift_in_break"
          ) {
            bgColor = "#10b981";
          }
          else if (shift.status === "shift_finished") bgColor = "#8b5cf6";
          else if (shift.status === "shift_approved") bgColor = "#065f46";

          return {
            id: shift.shift_id,
            title: `${shift.customer_name} [${shift.invoice_no}] - ${shift.service_address}`,
            start: shift.start_time,
            end: shift.end_time,
            backgroundColor: bgColor,
            borderColor: "transparent",
            textColor: "#ffffff",
          };
        });
        successCallback(events);
        setTotalShifts(res.count ?? res.data.length);
      } else {
        console.error("Failed to fetch calendar shifts", res.error);
        successCallback([]); // Return empty so it doesn't crash
      }
    } catch (error) {
      console.error(error);
      failureCallback(error);
    }
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-b-2 border-[#0064cb] pb-3 -mb-[13px]">
            <CalendarIcon className="w-5 h-5 text-[#0064cb]" />
            <span className="font-bold text-[#0064cb]">Calendar</span>
          </div>
          {totalShifts !== null && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-slate-500">Total Shifts :</span>
              <span className="text-sm font-extrabold text-[#0064cb]">{totalShifts}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-bold text-[#0064cb]">Show full duration</span>
            <button
              onClick={() => setShowFullDuration(!showFullDuration)}
              className={`relative inline-flex h-[22px] w-[42px] items-center rounded-full transition-colors cursor-pointer ${showFullDuration ? 'bg-[#0064cb]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${showFullDuration ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
            </button>
          </div>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="relative w-8 h-8 rounded-full border-2 border-[#0064cb] flex items-center justify-center transition-all cursor-pointer bg-white text-[#0064cb] hover:bg-blue-50 active:scale-95"
            title="Toggle Legend"
          >
            <Info className="w-[18px] h-[18px]" strokeWidth={2.5} />
            {showLegend && (
              <div className="absolute w-[24px] h-[2px] bg-[#0064cb] rotate-45 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-3 px-4 bg-white rounded-lg shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#9ca3af]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift Created - No guard assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#f59e0b]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift Planned - Awaiting Guard Acceptance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3b82f6]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift Accepted - Waiting to Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#10b981]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#8b5cf6]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift Finished</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#065f46]"></div>
            <span className="text-[13px] font-semibold text-slate-600">- Shift Completed</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button onClick={handleToday} variant="secondary" className="h-9 px-4 font-bold bg-slate-500 text-white hover:bg-slate-600 cursor-pointer transition-colors ml-2 rounded-md">
            Today
          </Button>
        </div>

        <h2 className="text-xl font-bold text-slate-800 tracking-tight hidden md:block">
          {currentDate || "Calendar"}
        </h2>

        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => changeView("dayGridMonth")}
            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${currentView === "dayGridMonth"
              ? "bg-blue-100 text-[#0064cb] shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            Month
          </button>
          <button
            onClick={() => changeView("listWeek")}
            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${currentView === "listWeek"
              ? "bg-blue-100 text-[#0064cb] shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            Week List
          </button>
          <button
            onClick={() => changeView("listDay")}
            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${currentView === "listDay"
              ? "bg-blue-100 text-[#0064cb] shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            Day List
          </button>
        </div>
      </div>

      <div className={`relative bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-h-[700px] calendar-wrapper ${!showFullDuration ? 'truncate-events' : ''}`}>

        {(selectedEvent || showMoreModal) && (
          <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] rounded-xl transition-all duration-300"></div>
        )}

        {isLoading && currentView === "dayGridMonth" && (
          <div className="absolute inset-0 z-50 bg-white rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-3 text-center">
                  <div className="h-4 w-8 bg-slate-200 animate-pulse rounded mx-auto"></div>
                </div>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-7" style={{ minHeight: '110px' }}>
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <div key={colIdx} className="border border-slate-100 p-2 flex flex-col gap-1.5">
                    <div className="h-5 w-5 bg-slate-200 animate-pulse rounded-full ml-auto mb-1" style={{ animationDelay: `${(rowIdx * 7 + colIdx) * 30}ms` }}></div>
                    {colIdx % 3 !== 2 && (
                      <div className="h-6 rounded animate-pulse" style={{ backgroundColor: ['#dbeafe', '#fef3c7', '#d1fae5', '#ede9fe'][(rowIdx * 7 + colIdx) % 4], animationDelay: `${(rowIdx * 7 + colIdx) * 40}ms` }} />
                    )}
                    {(rowIdx + colIdx) % 4 === 1 && (
                      <div className="h-6 rounded animate-pulse" style={{ backgroundColor: ['#fce7f3', '#dbeafe', '#fef3c7', '#d1fae5'][(rowIdx * 7 + colIdx) % 4], animationDelay: `${(rowIdx * 7 + colIdx) * 60}ms` }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {isLoading && (currentView === "listWeek" || currentView === "listDay") && (
          <div className="absolute inset-0 z-50 bg-white rounded-xl overflow-hidden p-2">
            {Array.from({ length: currentView === "listDay" ? 1 : 3 }).map((_, groupIdx) => (
              <div key={groupIdx} className="mb-3">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg mb-1">
                  <div className="h-4 w-24 bg-slate-300 animate-pulse rounded" style={{ animationDelay: `${groupIdx * 100}ms` }}></div>
                  <div className="h-4 w-28 bg-slate-200 animate-pulse rounded" style={{ animationDelay: `${groupIdx * 120}ms` }}></div>
                </div>
                {Array.from({ length: groupIdx === 0 ? 4 : groupIdx === 1 ? 3 : 2 }).map((_, rowIdx) => {
                  const colors = ['#dbeafe', '#fef3c7', '#d1fae5', '#ede9fe', '#fce7f3'];
                  const bg = colors[(groupIdx * 5 + rowIdx) % colors.length];
                  return (
                    <div
                      key={rowIdx}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg mb-1 animate-pulse"
                      style={{ backgroundColor: bg, animationDelay: `${(groupIdx * 4 + rowIdx) * 60}ms` }}
                    >
                      <div className="h-4 w-24 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}></div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}></div>
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {selectedEvent && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-[750px] max-w-[92vw] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Shift Details</h3>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5 cursor-pointer" />
                </button>
              </div>
              <div className="p-5">
                <div
                  className="p-4 rounded-lg border-l-[3px]"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${selectedEvent.backgroundColor} 15%, transparent)`,
                    borderColor: selectedEvent.backgroundColor,
                    color: selectedEvent.backgroundColor
                  }}
                >
                  <div className="font-bold mb-2 flex items-center gap-2">
                    <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: selectedEvent.backgroundColor }}></div>
                    {selectedEvent.start?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {selectedEvent.end ? ` - ${selectedEvent.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                  </div>
                  <div className="font-semibold text-[14px] leading-relaxed ml-[14px]">{selectedEvent.title}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showMoreModal && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-[750px] max-w-[92vw] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">
                  {showMoreModal.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button onClick={() => setShowMoreModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5 cursor-pointer" />
                </button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {showMoreModal.events.map((event: any, idx: number) => (
                    <div
                      key={event.id || idx}
                      className="p-3 rounded-lg border-l-[3px] cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${event.backgroundColor} 15%, transparent)`,
                        borderColor: event.backgroundColor,
                        color: event.backgroundColor
                      }}
                      onClick={() => {
                        setShowMoreModal(null);
                        setSelectedEvent({
                          title: event.title,
                          start: event.start,
                          end: event.end,
                          backgroundColor: event.backgroundColor
                        });
                      }}
                    >
                      <div className="font-bold mb-1 flex items-center gap-2 text-[13px]">
                        <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: event.backgroundColor }}></div>
                        {event.start?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="font-semibold text-[14px] ml-[14px] truncate">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={fetchEvents}
          headerToolbar={false}
          height="auto"
          dayMaxEvents={2}
          displayEventEnd={showFullDuration}
          moreLinkContent={(args) => "+" + args.num + " more"}
          moreLinkClick={(arg) => {
            const events = arg.allSegs.map((seg: any) => seg.event);
            setShowMoreModal({ date: arg.date, events });
            return "function"; // prevents the default native popover
          }}
          eventDisplay="list-item"
          loading={(loadingState) => setIsLoading(loadingState)}
          viewDidMount={(info) => setCurrentDate(info.view.title)}
          eventDidMount={(info) => {
            const color = info.event.backgroundColor;
            if (color) {
              info.el.style.setProperty('--event-color', color);
              info.el.style.setProperty('--event-color-light', `color-mix(in srgb, ${color} 15%, transparent)`);
            }
          }}
          eventClick={(info) => {
            setSelectedEvent({
              title: info.event.title,
              start: info.event.start,
              end: info.event.end,
              backgroundColor: info.event.backgroundColor || info.el.style.getPropertyValue('--event-color')
            });
          }}
        />
      </div>
    </div>
  );
}
