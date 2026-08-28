import Link from "next/link";
import Card from "@/components/ui/Card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <Link
        href="/"
        className="mb-8 text-center font-serif text-2xl text-text-primary"
      >
        Memoria Activa
      </Link>
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}
