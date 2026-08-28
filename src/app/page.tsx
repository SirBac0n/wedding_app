export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">Our Wedding</h1>
      <p className="max-w-md text-gray-500">
        The full public site (event details, RSVP, registry) is coming soon.
      </p>
      <a
        href="/address"
        className="rounded bg-gray-900 px-4 py-2 text-sm text-white"
      >
        Find Your Invitation
      </a>
      <a href="/admin/login" className="text-sm underline text-gray-400">
        Admin sign in
      </a>
    </div>
  );
}
