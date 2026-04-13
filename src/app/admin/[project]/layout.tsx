"use client";

import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const project = params.project as string;

  return (
    <>
      <AdminNav
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: project },
        ]}
      />
      {children}
    </>
  );
}
