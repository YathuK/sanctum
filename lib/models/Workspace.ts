import mongoose, { Schema, models, model } from "mongoose";

export interface IWorkspace {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: "developer" | "team" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  apiCallsThisMonth: number;
  billingCycleStart: Date;
  createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  plan: { type: String, enum: ["developer", "team", "enterprise"], default: "developer" },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  apiCallsThisMonth: { type: Number, default: 0 },
  billingCycleStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export const Workspace = models.Workspace || model<IWorkspace>("Workspace", WorkspaceSchema);

// ─── Workspace Members ───

export interface IMember {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  role: "admin" | "approver" | "viewer" | "api_only";
  invitedBy: mongoose.Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
}

const MemberSchema = new Schema<IMember>({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["admin", "approver", "viewer", "api_only"], default: "viewer" },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
  joinedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

MemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
MemberSchema.index({ userId: 1 });

export const Member = models.Member || model<IMember>("Member", MemberSchema);

// ─── Approval Chains ───

export interface IApprovalChain {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  rules: {
    minAmount: number;
    maxAmount: number;
    approverRole: "approver" | "admin";
    approverEmail?: string;
    autoApproveBelow?: number;
  }[];
  isDefault: boolean;
  createdAt: Date;
}

const ApprovalChainSchema = new Schema<IApprovalChain>({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  name: { type: String, required: true },
  rules: [{
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    approverRole: { type: String, enum: ["approver", "admin"], default: "approver" },
    approverEmail: { type: String },
    autoApproveBelow: { type: Number },
  }],
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const ApprovalChain = models.ApprovalChain || model<IApprovalChain>("ApprovalChain", ApprovalChainSchema);
