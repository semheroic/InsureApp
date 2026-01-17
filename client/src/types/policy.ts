export interface Policy {
  plate: string;
  owner: string;
  company: string;
  expiryDate: string;
  contact: string;
  daysOverdue?: number;
}

export interface ExpiryData {
  today: Policy[];
  week: Policy[];
  month: Policy[];
  expired: Policy[];
}

export type CompanyFilter = "all" | "soras" | "sonarwa" | "prime" | "radiant";
