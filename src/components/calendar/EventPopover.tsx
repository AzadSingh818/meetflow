'use client';

import { formatDateTime, getDuration } from '@/lib/utils';
import {
  X,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface Meeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  status: string;
  location?: string;
  description?: string;
  meetLink?: string;

  organizer: {
    name: string;
    email: string;
  };

  attendees: Array<{
    email?: string;
    name?: string;
    status: string;
  }>;
}

interface EventPopoverProps {
  meeting: Meeting;
  onClose: () => void;
  onView: () => void;
}

export function EventPopover({
  meeting,
  onClose,
  onView
}: EventPopoverProps) {

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2
        -translate-x-1/2 -translate-y-1/2
        z-50 w-80 bg-white rounded-2xl
        shadow-2xl border border-slate-100
        animate-slide-up overflow-hidden">

        {/* Top color strip */}
        <div
          className="h-1.5"
          style={{
            backgroundColor: meeting.color
          }}
        />

        <div className="p-5">

          {/* Header */}
          <div className="flex items-start justify-between mb-4">

            <div className="flex-1 min-w-0 pr-4">

              <h3 className="font-display font-bold text-navy-800 text-lg leading-tight">
                {meeting.title}
              </h3>

              <span
                className={`inline-block mt-1
                text-xs px-2 py-0.5 rounded-full
                font-medium

                ${
                  meeting.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : meeting.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {meeting.status}
              </span>

            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg
              hover:bg-slate-100
              text-slate-400"
            >
              <X className="w-4 h-4"/>
            </button>

          </div>

          {/* Content */}
          <div className="space-y-3 text-sm">

            <div className="flex items-start gap-2.5 text-slate-600">

              <Clock className="w-4 h-4 mt-0.5 text-blue-500"/>

              <div>
                <p>
                  {formatDateTime(meeting.startTime)}
                </p>

                <p className="text-xs text-slate-400">
                  {getDuration(
                    meeting.startTime,
                    meeting.endTime
                  )} mins
                </p>

              </div>

            </div>

            {meeting.location && (

              <div className="flex items-center gap-2.5 text-slate-600">

                <MapPin className="w-4 h-4 text-blue-500"/>

                <span>
                  {meeting.location}
                </span>

              </div>

            )}

            {meeting.attendees.length > 0 && (

              <div className="flex items-start gap-2.5">

                <Users className="w-4 h-4 mt-0.5 text-blue-500"/>

                <div className="flex flex-wrap gap-1">

                  {meeting.attendees
                    .slice(0,3)
                    .map((a,i)=>(

                    <span
                      key={i}
                      className="text-xs
                      bg-slate-100
                      text-slate-600
                      px-2 py-0.5
                      rounded-full"
                    >
                      {a.name || a.email}
                    </span>

                  ))}

                  {meeting.attendees.length>3 && (

                    <span className="text-xs text-slate-400">
                      +{meeting.attendees.length-3} more
                    </span>

                  )}

                </div>

              </div>

            )}

            {meeting.description && (

              <p className="text-slate-500 text-xs
                leading-relaxed bg-slate-50
                rounded-lg p-2.5 line-clamp-2">

                {meeting.description}

              </p>

            )}

          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">

            {meeting.meetLink && (

              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex
                items-center justify-center gap-1.5
                py-2 px-3 rounded-xl
                border border-emerald-200
                bg-emerald-50 text-emerald-700
                text-sm font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5"/>

                Join
              </a>

            )}

            <button
              onClick={onView}
              className="flex-1 flex
              items-center justify-center gap-1.5
              py-2 px-3 rounded-xl
              bg-blue-600 text-white
              text-sm font-medium"
            >
              <Calendar className="w-3.5 h-3.5"/>

              View Details
            </button>

          </div>

        </div>

      </div>
    </>
  );
}