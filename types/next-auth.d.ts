import type { DefaultSession } from "next-auth";

import type { Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: Plan;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: Plan;
  }
}
