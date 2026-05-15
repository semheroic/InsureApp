export interface Policy {
  id?: number;
  policy_number: string;
  plate: string;
  owner: string;
  company: string;
  startDate?: string;
  expiryDate: string;
  contact: string;
  followup_status?: "confirmed" | "pending" | "missed";
  days_remaining?: number;
  days_overdue?: number;
  daysOverdue?: number;
  created_by?: number | null;
}

export interface ExpiryData {
  today: Policy[];
  week: Policy[];
  month: Policy[];
  expired: Policy[];
}

export type CompanyFilter = "all" | "soras" | "sonarwa" | "prime" | "radiant";
