"use client";
import Image from "next/image";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      aria-label="Sign out"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-red-400/40 bg-red-500/10 p-2 transition hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      <Image
        src="/signout.svg"
        alt="Logout Icon"
        width={30}
        height={15}
        className="inline-block mr-2"
      />
    </button>
  );
}
