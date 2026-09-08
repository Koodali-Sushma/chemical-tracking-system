import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chemical Tracking System",
  description:
    "Laboratory management tool for tracking chemical inventory and usage.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  // Check the current URL path to see if we are on the simulator page
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") || headersList.get("x-url") || "";
  const isSimulator = pathname.includes("/simulator");

  // Determine whether to show the sidebar (hide if unauthenticated, no role, or on simulator)
  const showSidebar = session && role && !isSimulator;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {showSidebar ? (
          <div className="flex h-screen overflow-hidden">
            {/* Left navigation taking 20% width */}
            <Sidebar role={role} />

            {/* Main content taking the remaining 80% */}
            <main className="w-[80%] bg-gray-50 h-full overflow-y-auto">
              <div className="p-8 pb-24">{children}</div>
            </main>
          </div>
        ) : (
          /* Full-width layout for login, simulator, or unauthenticated pages */
          <main className="min-h-screen bg-gray-100 ">{children}</main>
        )}
      </body>
    </html>
  );
}
