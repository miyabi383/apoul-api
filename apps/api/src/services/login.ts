// src/server/services/login.ts

import * as argon2 from "argon2";
import { prisma } from "../db";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) return null;
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return null;
  return { id: user.ref, email: user.email, role: user.role };
}
