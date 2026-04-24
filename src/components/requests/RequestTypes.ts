export interface Request {
  id: number;
  type: "LEAVE" | "GATEPASS";
  details: string;
  status: string;
  timestamp: string;
  metadata?: any;
}

export type TabValue = "ALL" | "LEAVE" | "GATEPASS";
