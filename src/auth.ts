import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";

/**
 * Auth.js v5 with phone + password sign-in and JWT sessions (no database
 * session table). Server code should use the helpers in `src/lib/session.ts`
 * rather than calling `auth()` directly.
 */
export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { phone: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new CredentialsSignin();

        const user = await db.user.findUnique({ where: { phone: parsed.data.phone } });
        // Compare against a dummy hash when the user does not exist, so the
        // response time does not reveal which phone numbers are registered.
        const hash =
          user?.passwordHash ?? "$2b$12$QhU6oxwc7J3LjRa7faYOLe1OmfCDSIfHX2h6schiFA3mg363DI/Pe";
        const valid = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !user.passwordHash || !valid) throw new CredentialsSignin();

        return { id: user.id, name: user.name ?? user.phone, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, trigger, session }) {
      // Profile edits refresh the display name kept in the session token.
      if (trigger === "update" && typeof session?.user?.name === "string") {
        token.name = session.user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
