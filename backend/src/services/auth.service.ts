import bcrypt from "bcryptjs";
import { userRepo } from "../repositories/user.repo.js";
import { signToken } from "../utils/token.js";
import { unauthorized } from "../utils/errors.js";
import type { LoginPayload } from "../validation/auth.schema.js";

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string; role: string };
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const user = await userRepo.findByEmail(payload.email);
  if (!user) throw unauthorized("Invalid credentials");

  const matches = await bcrypt.compare(payload.password, user.passwordHash);
  if (!matches) throw unauthorized("Invalid credentials");

  const token = signToken({ sub: String(user._id), email: user.email, role: user.role });
  return {
    token,
    user: { id: String(user._id), email: user.email, name: user.name ?? "", role: user.role },
  };
}
