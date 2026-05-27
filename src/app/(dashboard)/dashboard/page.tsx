import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Meeting from '@/models/Meeting';
import CalendarView from '@/components/calendar/CalendarView';

import {
  Calendar,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard'
};

async function getDashboardData(
  userId: string,
  email: string
) {

  await connectDB();

  const query = {
    $or: [
      { organizer: userId },
      { 'attendees.email': email }
    ]
  };

  const now = new Date();

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  const todayEnd = new Date();
  todayEnd.setHours(
    23,59,59,999
  );

  const [
    total,
    upcoming,
    today,
    completed,
    meetings
  ] = await Promise.all([

    Meeting.countDocuments({
      ...query,
      status:'scheduled'
    }),

    Meeting.countDocuments({
      ...query,
      status:'scheduled',
      startTime:{
        $gte:now
      }
    }),

    Meeting.countDocuments({
      ...query,
      status:'scheduled',
      startTime:{
        $gte:todayStart,
        $lte:todayEnd
      }
    }),

    Meeting.countDocuments({
      ...query,
      status:'completed'
    }),

    Meeting.find(query)
      .sort({
        startTime:1
      })
      .lean()
  ]);

  return {
    stats:{
      total,
      upcoming,
      today,
      completed
    },
    meetings
  };
}

const STATS = [
  {
    key:'today',
    label:'Today',
    Icon:Calendar,
    color:'text-blue-600',
    bg:'bg-blue-50'
  },
  {
    key:'upcoming',
    label:'Upcoming',
    Icon:Clock,
    color:'text-purple-600',
    bg:'bg-purple-50'
  },
  {
    key:'total',
    label:'Scheduled',
    Icon:Users,
    color:'text-green-600',
    bg:'bg-green-50'
  },
  {
    key:'completed',
    label:'Completed',
    Icon:CheckCircle,
    color:'text-gray-600',
    bg:'bg-gray-50'
  }
];

export default async function DashboardPage(){

  const session =
    await getServerSession(
      authOptions
    );

  if(!session){
    return null;
  }

  const {
    stats,
    meetings
  } =
    await getDashboardData(
      session.user.id,
      session.user.email
    );

  return (

    <div className="p-6 space-y-6">

      {/* greeting */}

      <div>

        <h2 className="text-xl font-semibold">

          Good {

          new Date().getHours()<12
            ? 'morning'
            : new Date().getHours()<18
            ? 'afternoon'
            : 'evening'

          }, {session.user.name}

        </h2>

      </div>

      {/* stats */}

      <div
        className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-4
      "
      >

        {STATS.map(
          ({
            key,
            label,
            Icon,
            color,
            bg
          })=>(

          <div
            key={key}
            className="
            bg-white
            rounded-xl
            border
            p-4
            flex
            items-center
            gap-4
          "
          >

            <div
              className={`h-10 w-10 rounded-lg ${bg}
              flex items-center justify-center`}
            >

              <Icon
                className={`h-5 w-5 ${color}`}
              />

            </div>

            <div>

              <p className="text-2xl font-bold">

                {
                  stats[
                    key as keyof typeof stats
                  ]
                }

              </p>

              <p className="text-xs">

                {label}

              </p>

            </div>

          </div>

        ))}

      </div>

      {/* calendar */}

      <div
        className="
        bg-white
        rounded-xl
        border
        p-5
      "
      >

        <CalendarView
          meetings={
            JSON.parse(
              JSON.stringify(meetings)
            )
          }
        />

      </div>

    </div>

  );
}