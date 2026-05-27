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
  organizer: {
    name: string;
    email: string;
  };
  attendees: Array<{
    email: string;
    status: string;
  }>;
}

interface CalendarViewProps {
  meetings?: Meeting[];
}

const CalendarView = ({
  meetings = []
}: CalendarViewProps) => {

  const router = useRouter();

  const [popover, setPopover] =
    useState<{
      meeting: Meeting;
      el: HTMLElement;
    } | null>(null);

  const events = Array.isArray(meetings)
    ? meetings.map((m) => ({
        id: m._id,
        title: m.title,
        start: m.startTime,
        end: m.endTime,
        backgroundColor: m.color || '#2563EB',
        borderColor: m.color || '#2563EB',
        extendedProps: m
      }))
    : [];

  return (
    <div className="bg-white rounded-2xl border p-4 h-full relative">

      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin
        ]}
        initialView="dayGridMonth"
        headerToolbar={{
          left:'prev,next today',
          center:'title',
          right:'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        height="calc(100vh - 220px)"
        dayMaxEvents={3}
        eventTimeFormat={{
          hour:'numeric',
          minute:'2-digit',
          meridiem:'short'
        }}

        eventClick={(info)=>{

          info.jsEvent.stopPropagation();

          setPopover({
            meeting:
              info.event.extendedProps as Meeting,
            el: info.el
          });

        }}

        dateClick={(info)=>{

          router.push(
            `/meetings/create?date=${info.dateStr}`
          );

        }}
      />

      {popover && (

        <EventPopover
          meeting={popover.meeting}
          onClose={() =>
            setPopover(null)
          }
          onView={() => {

            router.push(
              `/meetings/${popover.meeting._id}`
            );

            setPopover(null);

          }}
        />

      )}

    </div>
  );
};

export default CalendarView;