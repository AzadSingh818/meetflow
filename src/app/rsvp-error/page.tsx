export default function RSVPError({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const messages: Record<string, string> = {
    invalid_link:  'This RSVP link is invalid or malformed.',
    invalid_token: 'This link has already been used or is not valid.',
    not_found:     'The meeting could not be found.',
    server_error:  'Something went wrong on our end. Please try again.',
  }

  const msg =
    messages[searchParams.reason ?? ''] ??
    'An unknown error occurred.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">RSVP Failed</h1>
        <p className="text-gray-500 text-sm">{msg}</p>
      </div>
    </div>
  )
}