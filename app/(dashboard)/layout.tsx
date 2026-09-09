import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || !role) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar receives the role prop securely from the server */}
      <Sidebar role={role} />

      {/* Main content taking the remaining 80% width */}
      <main className="w-[80%] bg-gray-50 h-full overflow-y-auto">
        <div className="p-8 pb-24">{children}</div>
      </main>
    </div>
  );
}
