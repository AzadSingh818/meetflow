import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Meeting from '@/models/Meeting';
import CalendarView from '@/components/calendar/CalendarView';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

// Force dynamic so new Date() is always evaluated at request time on the server
// and never pre-rendered as static HTML that mismatches the client
export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string, email: string) {
  await connectDB();

  const query = {
    $or: [{ organizer: userId }, { 'attendees.email': email }]
  };

  const now        = new Date();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

  const [total, upcoming, today, completed, meetings] = await Promise.all([
    Meeting.countDocuments({ ...query, status: 'scheduled' }),
    Meeting.countDocuments({ ...query, status: 'scheduled', startTime: { $gte: now } }),
    Meeting.countDocuments({ ...query, status: 'scheduled', startTime: { $gte: todayStart, $lte: todayEnd } }),
    Meeting.countDocuments({ ...query, status: 'completed' }),
    Meeting.find(query).sort({ startTime: 1 }).lean()
  ]);

  return { stats: { total, upcoming, today, completed }, meetings };
}

const STATS = [
  { key: 'today',     label: 'Today',     Icon: Calendar,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { key: 'upcoming',  label: 'Upcoming',  Icon: Clock,       color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'total',     label: 'Scheduled', Icon: Users,       color: 'text-green-600',  bg: 'bg-green-50'  },
  { key: 'completed', label: 'Completed', Icon: CheckCircle, color: 'text-gray-600',   bg: 'bg-gray-50'   },
];

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { stats, meetings } = await getDashboardData(
    session.user.id,
    session.user.email
  );

  // Greeting computed once on the server — no client mismatch possible
  const greeting = getGreeting()

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Greeting — suppressHydrationWarning in case of tiny clock skew */}
      <div>
        <h2
          className="text-lg sm:text-xl font-semibold truncate"
          suppressHydrationWarning
        >
          Good {greeting}, {session.user.name}
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map(({ key, label, Icon, color, bg }) => (
          <div key={key}
            className="bg-white rounded-xl border p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold leading-none">
                {stats[key as keyof typeof stats]}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border p-3 sm:p-5 overflow-hidden">
        <CalendarView meetings={JSON.parse(JSON.stringify(meetings))} />
      </div>

    </div>
  );
}