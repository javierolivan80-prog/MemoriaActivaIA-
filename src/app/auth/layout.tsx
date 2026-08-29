import EntryShell from "@/components/layout/EntryShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EntryShell>{children}</EntryShell>;
}
