export default function RSVPConfirmed({
  searchParams,
}: {
  searchParams: { status?: string; meeting?: string; email?: string }
}) {
  const accepted = searchParams.status === 'accepted'
  const title    = searchParams.meeting
    ? decodeURIComponent(searchParams.meeting)
    : 'the meeting'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-5xl mb-4">{accepted ? '✅' : '❌'}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {accepted ? "You're going!" : 'Response recorded'}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          You have{' '}
          <strong className={accepted ? 'text-green-600' : 'text-red-500'}>
            {accepted ? 'accepted' : 'declined'}
          </strong>{' '}
          the invite for <strong className="text-gray-800">{title}</strong>.
        </p>
        <p className="mt-6 text-xs text-gray-400">You can close this tab.</p>
      </div>
    </div>
  )
}