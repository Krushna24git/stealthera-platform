import { Schema, model, type HydratedDocument } from "mongoose";

export interface IUser {
  email: string;
  name: string;
  role: "admin" | "clinician";
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    role: { type: String, enum: ["admin", "clinician"], default: "clinician" },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export type UserDoc = HydratedDocument<IUser>;

export const User = model<IUser>("User", userSchema, "users");
