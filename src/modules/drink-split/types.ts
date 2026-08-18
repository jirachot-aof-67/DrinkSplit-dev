export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

export interface Participant {
  friendId: string;
  amountPaid: number;
  shareAmount?: number;
  promiseDate?: string;
}

export interface Bill {
  id: string;
  venueId: string;
  title: string;
  totalAmount: number;
  payerId: string;
  participants: Participant[];
  date: string;
  isSettled: boolean;
}

export interface Venue {
  id: string;
  name: string;
  date: string;
}

export interface AppData {
  friends: Friend[];
  venues: Venue[];
  bills: Bill[];
}

export interface DebtSummary {
  billId: string;
  from: string;
  to: string;
  totalOwed: number;
  paidSoFar: number;
  remaining: number;
  daysPending: number;
  promiseDate?: string;
}
