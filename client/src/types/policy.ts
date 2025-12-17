export interface Policy {
  id: number;                  // include ID for follow-up & actions
  plate: string;
  owner: string;
  company: string;
  expiryDate: string;
  contact: string;
  daysOverdue?: number;         // for expired policies
}

export interface ExpiryData {
  today: Policy[];
  week: Policy[];
  month: Policy[];
  expired: Policy[];
}

export type CompanyFilter = "all" | "soras" | "sonarwa" | "prime" | "radiant";
