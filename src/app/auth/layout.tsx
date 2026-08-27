export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <h1 className="mb-10 text-3xl font-semibold tracking-tight text-gray-900">
        MEMORIA ACTIVA
      </h1>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        {children}
      </div>
    </div>
  );
}
