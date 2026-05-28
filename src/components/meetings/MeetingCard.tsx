"use client";
import Link from "next/link";
import { Meeting } from "@/types/meeting";
import { formatMeetingDate, formatMeetingTime, getMeetingDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from "lucide-react";

interface Props {
  meeting: Meeting;
  compact?: boolean;
}

export function MeetingCard({ meeting, compact = false }: Props) {
  return (
    <Link href={`/meetings/${meeting._id}`}>
      <div className={`group border border-gray-100 rounded-xl hover:border-blue-200
        hover:shadow-sm transition-all bg-white ${compact ? 'p-2.5' : 'p-3 sm:p-4'}`}>

        {/* Color dot + title + badge */}
        <div className="flex items-start gap-2">
          <div
            className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: meeting.color }}
          />
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-gray-900 truncate group-hover:text-blue-600
              transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
              {meeting.title}
            </p>
            {!compact && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatMeetingDate(new Date(meeting.startTime))}
              </p>
            )}
          </div>
          <Badge
            variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}
            className="text-xs flex-shrink-0 capitalize"
          >
            {meeting.status}
          </Badge>
        </div>

        {/* Meta row — wraps naturally on small screens */}
        {!compact && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {formatMeetingTime(meeting.startTime, meeting.endTime)}
                {' · '}
                {getMeetingDuration(meeting.startTime, meeting.endTime)}
              </span>
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {meeting.location}
                </span>
              </span>
            )}
            {meeting.attendees.length > 0 && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <Users className="w-3 h-3 flex-shrink-0" />
                {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}