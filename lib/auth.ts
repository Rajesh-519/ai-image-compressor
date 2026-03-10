import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Plan } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const providers: NextAuthOptions["providers"] = [];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  );
}

async function resolveUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "TRIALING"]
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return subscription?.plan ?? "FREE";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/signin"
  },
  providers,
  callbacks: {
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      token.plan = await resolveUserPlan(token.sub);
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.plan = (token.plan as Plan | undefined) ?? "FREE";
      return session;
    }
  }
};
