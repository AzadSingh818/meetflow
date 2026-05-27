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
      <div
        className={`group border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-sm
          transition-all bg-white ${compact ? "p-2.5 mb-2" : "p-4 mb-3"}`}
      >
        {/* Color dot + title */}
        <div className="flex items-start gap-2">
          <div
            className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: meeting.color }}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-gray-900 truncate group-hover:text-primary
                transition-colors ${compact ? "text-xs" : "text-sm"}`}
            >
              {meeting.title}
            </p>
            {!compact && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatMeetingDate(new Date(meeting.startTime))}
              </p>
            )}
          </div>
          <Badge
            variant={meeting.status === "scheduled" ? "default" : "secondary"}
            className="text-xs shrink-0"
          >
            {meeting.status}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatMeetingTime(meeting.startTime, meeting.endTime)}
            {" · "}
            {getMeetingDuration(meeting.startTime, meeting.endTime)}
          </span>
          {meeting.location && !compact && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {meeting.location}
            </span>
          )}
          {meeting.attendees.length > 0 && !compact && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}