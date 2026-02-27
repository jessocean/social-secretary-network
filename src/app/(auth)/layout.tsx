export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
