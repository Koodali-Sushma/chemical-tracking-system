"use client";
import Image from "next/image";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>
      <Image
        src="/signout.svg"
        alt="Logout Icon"
        width={70}
        height={40}
        className="inline-block mr-2"
      />
    </button>
  );
}
