import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";

export default function Sidebar({ role }: { role: string }) {
  return (
    <aside className="w-[20%] h-full bg-green-300 p-6 pb-10 overflow-y-auto flex flex-col justify-between">
      <div>
        <div className="mb-8">
          <Link href="/">
            <Image
              src="/gemini-svg-2.svg"
              alt="Hi Labs Hildesheim"
              width={200}
              height={50}
              className="h-30 w-100 object-contain"
              priority
            />
          </Link>
        </div>
        <nav className="space-y-4">
          {role === "admin" && (
            <>
              <Link
                href="/"
                className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
              >
                Stocks
              </Link>
              <Link
                href="/admin/access-requests"
                className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
              >
                Access Requests
              </Link>
              {/* <Link
                href="/"
                className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
              >
                Usage Reports
              </Link> */}
            </>
          )}

          {role === "scientist" && (
            <>
              <Link
                href="/request-access"
                className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
              >
                Request Access
              </Link>

              <Link
                href="/logs"
                className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
              >
                Usage Reports
              </Link>
            </>
          )}
          {role === "lab_technician" && (
            <Link
              href="/"
              className="text-gray-600 hover:text-white block py-2 px-3 rounded hover:bg-gray-800 transition border-b border-gray-800"
            >
              Stocks
            </Link>
          )}
        </nav>
      </div>

      <div className="text-s text-gray-400 border-t border-gray-800 pt-4">
        <div className="flex justify-between mb-4">
          <SignOutButton />
          {role !== "admin" && (
            <Link href="/simulator" target="_blank" rel="noopener noreferrer">
              <Image
                src="/simulator.svg"
                alt="Simulator Icon"
                width={70}
                height={40}
                className="inline-block mr-2"
              />
            </Link>
          )}
        </div>
        Logged in as:{" "}
        <span className="capitalize text-gray-600 italic font-semibold">
          {role.replace("_", " ")}
        </span>
      </div>
    </aside>
  );
}
