
import React from 'react';
import { 
  GlassWater, 
  Beer, 
  Wine, 
  Store, 
  Users, 
  CreditCard, 
  TrendingDown, 
  CheckCircle2, 
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  Info
} from 'lucide-react';

export const ICONS = {
  Glass: GlassWater,
  Beer: Beer,
  Wine: Wine,
  Venue: Store,
  Users: Users,
  Payment: CreditCard,
  Debt: TrendingDown,
  Settled: CheckCircle2,
  Pending: Clock,
  Add: Plus,
  Delete: Trash2,
  Arrow: ChevronRight,
  Info: Info
};

export const STORAGE_KEY = 'drinksplit_v1_data';

export const INITIAL_DATA = {
  friends: [
    { id: '1', name: 'ตัวฉัน' },
    { id: '2', name: 'กอล์ฟ' },
    { id: '3', name: 'เบนซ์' }
  ],
  venues: [],
  bills: []
};
