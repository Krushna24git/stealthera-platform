import { User, type UserDoc } from "../db/models/User.js";

export const userRepo = {
  async findByEmail(email: string): Promise<UserDoc | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  },

  async createIfAbsent(input: {
    email: string;
    name: string;
    role: "admin" | "clinician";
    passwordHash: string;
  }): Promise<UserDoc> {
    const existing = await this.findByEmail(input.email);
    if (existing) return existing;
    return User.create(input);
  },
};
