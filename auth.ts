import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/db/connect";
import User from "@/db/models/User";
import { findDemoUser } from "@/lib/demoUsers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          await dbConnect();

          const email = String(credentials.email).toLowerCase().trim();

          let user = await User.findOne({ email });

          // Provision demo accounts on first use so demo login always works.
          if (!user) {
            const demo = findDemoUser(email, String(credentials.password));
            if (demo) {
              user = await User.create({
                name: demo.name,
                email: demo.email,
                password: demo.password,
                role: demo.role,
              });
            }
          }

          if (!user) {
            return null;
          }

          const isPasswordValid = credentials.password === user.password;

          if (!isPasswordValid) {
            return null;
          }

          const allowedRoles = ["admin", "scientist", "lab_technician"];

          if (!allowedRoles.includes(user.role)) {
            throw new Error(
              "Access restricted to authorized laboratory personnel only.",
            );
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
