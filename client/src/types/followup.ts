
import { Policy } from "@/types/policy";

export type FollowUpStatus = "confirmed" | "pending" | "missed";

export interface FollowUpPolicy extends Policy {
  followUpStatus: FollowUpStatus;
  followedAt: string;
}
