"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className=" px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-500 text-sm font-medium transition-colors"
    >
      SIGN OUT
    </button>
  );
}
