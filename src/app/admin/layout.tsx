export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="cyber-bg min-h-screen">{children}</div>;
}
