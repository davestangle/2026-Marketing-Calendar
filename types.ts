
export type Quarter = 'FY26 - Q4' | 'FY27 - Q1' | 'FY27 - Q2' | 'FY27 - Q3';

export interface CampaignActivity {
  id: string;
  name: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
  resolved: boolean;
  replies: Comment[];
}

export interface LaunchDetails {
  title: string;
  logo?: string; // Base64 or URL
  image?: string; // Base64 or URL
  objective: string;
  // We keep the generic budget for display if needed, but rely on split for the 'screenshot' look
  budget: string; 
  performanceSpend: string;
  brandSpend: string;
  resources: LinkItem[];
  
  // NEW CUSTOM FIELDS
  launchDate?: string; // New field
  endDate?: string;    // New field
  section1Title?: string;
  section1Text?: string;
  section2Title?: string;
  section2Text?: string;
}

export interface MonthData {
  id: string;
  name: string;
  headerLogo?: string; // New field for the logo next to month name
  quarter: Quarter;
  year: number;
  productLaunch: LaunchDetails;
  campaigns: CampaignActivity[];
  comments: Comment[];
}
