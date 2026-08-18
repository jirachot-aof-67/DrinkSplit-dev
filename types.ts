
export interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

export interface Participant {
  friendId: string;
  amountPaid: number; // ยอดที่จ่ายคืนคนสำรองแล้ว
  shareAmount?: number; // ยอดที่เป็นส่วนที่คนนี้ต้องหาร (ถ้าไม่มีจะหารเฉลี่ย)
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
