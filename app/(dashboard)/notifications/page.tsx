import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";

export default async function NotificationsPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "lab_technician") {
    redirect("/");
  }

  await dbConnect();

  const chemicals = await Chemical.find({}).lean();

  const notifications: {
    id: string;
    type: "node" | "main";
    message: string;
    priority: string;
  }[] = [];

  chemicals.forEach((chem) => {
    if (chem.nodeStock < 1) {
      notifications.push({
        id: `${chem.formula}-node`,
        type: "node",
        message: `Action Required: Node stock for ${chem.name} (${chem.formula}) is critically low at ${chem.nodeStock}L. Please refill node from main stocks available.`,
        priority: "high",
      });
    }

    if (chem.mainStock < 5) {
      notifications.push({
        id: `${chem.formula}-main`,
        type: "main",
        message: `Reorder Warning: Main stock for ${chem.name} (${chem.formula}) has fallen to ${chem.mainStock}L. Reminder to order stock and request approval from admin.`,
        priority: "medium",
      });
    }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Lab Technician Notifications
        </h1>
        <p className="text-sm text-gray-600">
          Real-time inventory alerts triggered by simulator consumption and
          threshold limits.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center text-gray-500">
          No active alerts or warnings. All stock levels are optimal.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border shadow-sm flex items-start gap-4 ${
                notif.priority === "high"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-yellow-50 border-yellow-200 text-yellow-900"
              }`}
            >
              <div>
                <span className="font-semibold uppercase text-xs tracking-wider block mb-1">
                  {notif.type === "node"
                    ? "Node Refill Alert"
                    : "Main Stock Reorder"}
                </span>
                <p className="text-sm">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
