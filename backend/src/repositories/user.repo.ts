import { User, type UserDoc } from "../db/models/User.js";

export const userRepo = {
  async findByEmail(email: string): Promise<UserDoc | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  },

  async upsertByEmail(input: {
    email: string;
    name: string;
    role: "admin" | "clinician";
    passwordHash: string;
  }): Promise<UserDoc> {
    const email = input.email.toLowerCase().trim();
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { email, name: input.name, role: input.role, passwordHash: input.passwordHash } },
      { upsert: true, new: true }
    );
    return user as UserDoc;
  },
};
