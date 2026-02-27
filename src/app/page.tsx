import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        {/* Logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
          <svg
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Social Secretary
          </h1>
          <p className="text-lg text-gray-600">
            Your AI-powered social scheduler. Let your secretary handle the
            logistics so you can enjoy the hangouts.
          </p>
        </div>

        <div className="space-y-4 w-full">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gray-900 text-white font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            Get Started
          </Link>
          <p className="text-sm text-gray-500">
            Free for you and your friends. No app store needed.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-left">
          {[
            {
              title: "Smart Scheduling",
              desc: "AI finds the perfect time for everyone",
            },
            {
              title: "Calendar Aware",
              desc: "Respects naps, work, and sleep schedules",
            },
            {
              title: "Easy Coordination",
              desc: "Copy-paste messages to friends not on the app",
            },
            {
              title: "Mobile First",
              desc: "Install as an app right from your browser",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl bg-white/60 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
