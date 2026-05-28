'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';
import { EventPopover } from './EventPopover';

interface Meeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  status: string;
  location?: string;
  description?: string;
  organizer: { name: string; email: string };
  attendees: Array<{ email: string; status: string }>;
}

interface CalendarViewProps {
  meetings?: Meeting[];
}

const CalendarView = ({ meetings = [] }: CalendarViewProps) => {
  const router = useRouter();
  const [popover, setPopover] = useState<{ meeting: Meeting; el: HTMLElement } | null>(null);

  const events = Array.isArray(meetings)
    ? meetings.map((m) => ({
        id:              m._id,
        title:           m.title,
        start:           m.startTime,
        end:             m.endTime,
        backgroundColor: m.color || '#2563EB',
        borderColor:     m.color || '#2563EB',
        extendedProps:   m,
      }))
    : [];

  return (
    <div className="relative w-full overflow-x-auto">
      {/*
        Responsive calendar styles injected inline so they work without
        a separate CSS file. FullCalendar has no built-in mobile support.
      */}
      <style>{`
        /* ── Shrink toolbar on small screens ── */
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start !important;
          }
          .fc .fc-toolbar-title {
            font-size: 1rem !important;
          }
          .fc .fc-button {
            font-size: 0.7rem !important;
            padding: 4px 8px !important;
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.75rem;
          }
          .fc .fc-col-header-cell-cushion {
            font-size: 0.7rem;
            padding: 4px 2px !important;
          }
          .fc .fc-event-title {
            font-size: 0.65rem !important;
          }
          .fc .fc-daygrid-event {
            font-size: 0.65rem !important;
          }
          /* Hide time on very small screens */
          .fc .fc-event-time {
            display: none !important;
          }
        }

        /* ── Medium screens ── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .fc .fc-toolbar-title {
            font-size: 1.1rem !important;
          }
          .fc .fc-button {
            font-size: 0.75rem !important;
            padding: 5px 10px !important;
          }
        }

        /* ── General cleanup ── */
        .fc .fc-scrollgrid {
          border-radius: 8px;
          overflow: hidden;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #EFF6FF !important;
        }
        .fc .fc-button-primary {
          background-color: #2563EB !important;
          border-color: #2563EB !important;
        }
        .fc .fc-button-primary:not(.fc-button-active):hover {
          background-color: #1D4ED8 !important;
        }
        .fc .fc-button-active {
          background-color: #1E40AF !important;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left:   'prev,next today',
          center: 'title',
          right:  'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        // Height: adapts — auto on mobile, fixed calc on desktop
        height="auto"
        aspectRatio={1.6}
        dayMaxEvents={2}
        eventTimeFormat={{
          hour:     'numeric',
          minute:   '2-digit',
          meridiem: 'short',
        }}
        eventClick={(info) => {
          info.jsEvent.stopPropagation();
          setPopover({
            meeting: info.event.extendedProps as Meeting,
            el:      info.el,
          });
        }}
        dateClick={(info) => {
          router.push(`/meetings/create?date=${info.dateStr}`);
        }}
      />

      {popover && (
        <EventPopover
          meeting={popover.meeting}
          onClose={() => setPopover(null)}
          onView={() => {
            router.push(`/meetings/${popover.meeting._id}`);
            setPopover(null);
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;