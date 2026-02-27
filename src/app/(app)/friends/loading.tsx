export default function FriendsLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-gray-50">
      {/* Header skeleton */}
      <div className="px-4 pb-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200" />
            <div className="mt-1.5 h-4 w-20 animate-pulse rounded-md bg-gray-200" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
        </div>

        {/* Search skeleton */}
        <div className="mt-3 h-9 w-full animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Tabs skeleton */}
      <div className="px-4 pb-3">
        <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Friend card skeletons */}
      <div className="space-y-2 px-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm"
          >
            {/* Avatar */}
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-14 animate-pulse rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, j) => (
                  <div
                    key={j}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-200"
                  />
                ))}
              </div>
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Chevron */}
            <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
