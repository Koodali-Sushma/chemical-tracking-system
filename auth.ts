import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/db/connect";
import User from "@/db/models/User";

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
          // Normalize email to prevent case-sensitivity or whitespace issues
          const email = String(credentials.email).toLowerCase().trim();
          // Find the user in MongoDB
          const user = await User.findOne({ email });

          if (!user) {
            return null;
          }

          // Simple password check (Note: use bcrypt to hash and compare in production)
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

          // Return user object with role data attached to the session
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
    maxAge: 15 * 60, // Sets session expiration to 15 minutes (e.g., 15 * 60 seconds = 15 minutes)
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
