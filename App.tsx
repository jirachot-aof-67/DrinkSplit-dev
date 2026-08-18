
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppData, Friend, Venue, Bill, Participant, DebtSummary } from './types';
import { INITIAL_DATA, ICONS, STORAGE_KEY } from './constants';
import { getSettlementAdvice } from './services/geminiService';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';

// Firebase Imports
import { doc, onSnapshot, setDoc } from "@firebase/firestore";
import { signInWithPopup, onAuthStateChanged, signOut, type User } from "@firebase/auth";
import { db, auth, googleProvider } from './firebase';

const App: React.FC = () => {
  // 1. รหัสห้อง
  const [roomCode] = useState<string>(() => {
    return localStorage.getItem('drinksplit_room_code') || "default-room";
  });
  // const [tempCode, setTempCode] = useState("");
  // const [isEntryMode, setIsEntryMode] = useState(!localStorage.getItem('drinksplit_room_code'));

  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [usingCloud, setUsingCloud] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'venues' | 'friends' | 'ai' | 'receipt'>('dashboard');
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [isRenamingVenue, setIsRenamingVenue] = useState<string | null>(null);
  const [isAddingBill, setIsAddingBill] = useState<string | null>(null); 
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isRenamingFriend, setIsRenamingFriend] = useState<string | null>(null);
  const [isQuickPayingFriend, setIsQuickPayingFriend] = useState<string | null>(null);
  const [friendToDelete, setFriendToDelete] = useState<string | null>(null);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal Input States
  const [inputName, setInputName] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputPayer, setInputPayer] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [fixedShares, setFixedShares] = useState<Record<string, string>>({});
  const [paymentAmount, setPaymentAmount] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [selectedReceiptFriends, setSelectedReceiptFriends] = useState<string[]>([]);

  // 2. Auth Listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // 3. Firestore Sync Logic
  useEffect(() => {
    if (!db || !roomCode) {
      setUsingCloud(false);
      return;
    }

    const cleanCode = roomCode.trim().toLowerCase();
    const docRef = doc(db, "groups", cleanCode);
    setIsLoading(true);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as AppData;
        setData(cloudData);
        setUsingCloud(true);
      } else {
        setDoc(docRef, INITIAL_DATA);
        setData(INITIAL_DATA);
        setUsingCloud(true);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Sync Error:", error);
      setIsLoading(false);
      setUsingCloud(false);
    });

    return () => unsubscribe();
  }, [roomCode]);

  const persistData = useCallback(async (newData: AppData) => {
    setData(newData);
    if (usingCloud && db && roomCode) {
      setIsSyncing(true);
      try {
        const docRef = doc(db, "groups", roomCode.trim().toLowerCase());
        await setDoc(docRef, newData);
      } catch (error) {
        console.error("Cloud Sync Failed:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [usingCloud, roomCode]);

  const handleSignOut = async () => {
    if (auth && confirm("ต้องการออกจากระบบ Google หรือไม่?")) {
      await signOut(auth);
      setUser(null);
      setShowProfileMenu(false);
    }
  };

  const login = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login Error:", err);
    }
  };

  const getFriendName = (id: string) => data.friends.find(f => f.id === id)?.name || 'Unknown';

  // Calculations
  const debts = useMemo(() => {
    const summary: DebtSummary[] = [];
    if (!data.bills) return summary;
    
    data.bills.forEach(bill => {
      if (!bill.participants) return;
      
      bill.participants.forEach(p => {
        const share = p.shareAmount ?? (bill.totalAmount / (bill.participants.length || 1));
        if (p.friendId !== bill.payerId) {
          const remaining = share - p.amountPaid;
          if (remaining > 0.01) {
            const days = Math.floor((Date.now() - new Date(bill.date).getTime()) / (1000 * 60 * 60 * 24));
            summary.push({
              billId: bill.id,
              from: p.friendId,
              to: bill.payerId,
              totalOwed: share,
              paidSoFar: p.amountPaid,
              remaining: remaining,
              daysPending: days,
              promiseDate: p.promiseDate
            });
          }
        }
      });
    });
    return summary;
  }, [data.bills]);

  const dashboardSummaries = useMemo(() => {
    return data.venues.map(venue => {
      const venueBills = data.bills.filter(b => b.venueId === venue.id);
      const friendDebts: Record<string, number> = {};
      let venueTotalRemaining = 0;

      venueBills.forEach(bill => {
        if (!bill.participants) return;
        bill.participants.forEach(p => {
          const share = p.shareAmount ?? (bill.totalAmount / (bill.participants.length || 1));
          if (p.friendId !== bill.payerId) {
            const remaining = share - p.amountPaid;
            if (remaining > 0.01) {
              friendDebts[p.friendId] = (friendDebts[p.friendId] || 0) + remaining;
              venueTotalRemaining += remaining;
            }
          }
        });
      });

      return {
        venueId: venue.id,
        venueName: venue.name,
        friendDebts,
        totalRemaining: venueTotalRemaining
      };
    }).filter(s => s.totalRemaining > 0.01);
  }, [data.venues, data.bills]);

  const friendSummaries = useMemo(() => {
    const friendMap: Record<string, { friendId: string, friendName: string, venues: Record<string, number>, total: number }> = {};

    debts.forEach(debt => {
      if (!friendMap[debt.from]) {
        friendMap[debt.from] = {
          friendId: debt.from,
          friendName: getFriendName(debt.from),
          venues: {},
          total: 0
        };
      }
      
      const friendData = friendMap[debt.from];
      const bill = data.bills.find(b => b.id === debt.billId);
      const venue = data.venues.find(v => v.id === bill?.venueId);
      const venueName = venue?.name || 'ไม่ระบุร้าน';
      
      friendData.venues[venueName] = (friendData.venues[venueName] || 0) + debt.remaining;
      friendData.total += debt.remaining;
    });

    return Object.values(friendMap).sort((a, b) => b.total - a.total);
  }, [debts, data.venues, data.bills]);

  const totalOwed = debts.reduce((acc, d) => acc + d.remaining, 0);

  // Handlers for Add/Rename/Delete
  const handleAddFriend = () => {
    if (!inputName.trim()) return;
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const newFriend: Friend = { id: newId, name: inputName.trim() };
    persistData({ ...data, friends: [...data.friends, newFriend] });
    setInputName('');
    setIsAddingFriend(false);
  };

  const handleRenameFriend = () => {
    if (!inputName.trim() || !isRenamingFriend) return;
    persistData({
      ...data,
      friends: data.friends.map(f => f.id === isRenamingFriend ? { ...f, name: inputName.trim() } : f)
    });
    setInputName('');
    setIsRenamingFriend(null);
  };

  const handleAddVenue = () => {
    if (!inputName.trim()) return;
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const newVenue: Venue = { id: newId, name: inputName.trim(), date: new Date().toISOString() };
    persistData({ ...data, venues: [newVenue, ...data.venues] });
    setInputName('');
    setIsAddingVenue(false);
  };

  const handleRenameVenue = () => {
    if (!inputName.trim() || !isRenamingVenue) return;
    persistData({
      ...data,
      venues: data.venues.map(v => v.id === isRenamingVenue ? { ...v, name: inputName.trim() } : v)
    });
    setInputName('');
    setIsRenamingVenue(null);
  };

  const handleDeleteVenue = () => {
    if (!venueToDelete) return;
    persistData({
      ...data,
      venues: data.venues.filter(v => v.id !== venueToDelete),
      bills: data.bills.filter(b => b.venueId !== venueToDelete)
    });
    setVenueToDelete(null);
  };

  const calculateShares = (totalAmount: number, participantsIds: string[], fixed: Record<string, string>) => {
    const fixedIds = Object.keys(fixed).filter(id => participantsIds.includes(id) && fixed[id] !== '');
    const fixedSum = fixedIds.reduce((sum, id) => sum + parseFloat(fixed[id] || '0'), 0);
    if (fixedSum > totalAmount) {
      alert("ยอดรายคนเกินยอดรวม!");
      return null;
    }
    const remainingAmount = totalAmount - fixedSum;
    const others = participantsIds.filter(id => !fixedIds.includes(id));
    const sharedAmount = others.length > 0 ? remainingAmount / others.length : 0;
    return participantsIds.map(id => ({
      friendId: id,
      shareAmount: fixedIds.includes(id) ? parseFloat(fixed[id]) : sharedAmount
    }));
  };

  const handleSaveBill = (venueId?: string) => {
    const amountNum = parseFloat(inputAmount);
    if (!inputTitle || isNaN(amountNum) || amountNum <= 0 || !inputPayer || selectedParticipants.length === 0) {
      let missing = [];
      if (!inputTitle) missing.push("ชื่อรายการ");
      if (isNaN(amountNum) || amountNum <= 0) missing.push("ยอดเงินที่ถูกต้อง");
      if (!inputPayer) missing.push("คนจ่ายสำรอง");
      if (selectedParticipants.length === 0) missing.push("คนหาร");
      alert("กรุณากรอกข้อมูลให้ครบ: " + missing.join(", "));
      return;
    }
    const calculatedShares = calculateShares(amountNum, selectedParticipants, fixedShares);
    if (!calculatedShares) return;

    let newData: AppData;
    if (editingBillId) {
      newData = {
        ...data,
        bills: data.bills.map(b => {
          if (b.id !== editingBillId) return b;
          const newParticipants = calculatedShares.map(cs => {
            const existing = (b.participants || []).find(op => op.friendId === cs.friendId);
            return { ...cs, amountPaid: existing ? Math.min(cs.shareAmount, existing.amountPaid) : 0 };
          });
          const isAllPaid = newParticipants.every(p => {
            const pShare = p.shareAmount ?? (amountNum / (newParticipants.length || 1));
            return p.amountPaid >= pShare - 0.01;
          });
          return { ...b, title: inputTitle, totalAmount: amountNum, payerId: inputPayer, participants: newParticipants, isSettled: isAllPaid };
        })
      };
    } else if (venueId) {
      const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
      const newBill: Bill = {
        id: newId,
        venueId,
        title: inputTitle,
        totalAmount: amountNum,
        payerId: inputPayer,
        participants: calculatedShares.map(cs => ({ ...cs, amountPaid: 0 })),
        date: new Date().toISOString(),
        isSettled: false
      };
      newData = { ...data, bills: [newBill, ...data.bills] };
    } else {
      alert("เกิดข้อผิดพลาด: ไม่พบข้อมูลร้านค้าหรือบิลที่กำลังแก้ไข");
      return;
    }

    persistData(newData);
    setIsAddingBill(null);
    setEditingBillId(null);
    setInputTitle('');
    setInputAmount('');
    setSelectedParticipants([]);
    setFixedShares({});
  };

  const handleDeleteBill = (billId: string) => {
    persistData({ ...data, bills: data.bills.filter(b => b.id !== billId) });
    setEditingBillId(null);
  };

  const handleQuickPayment = () => {
    if (!isQuickPayingFriend) return;
    let paymentLeft = parseFloat(paymentAmount);
    if (isNaN(paymentLeft) || paymentLeft <= 0) return;

    // 1. ดึงหนี้ทั้งหมดที่เพื่อนคนนี้ต้องจ่าย และเรียงตามความเก่า (Oldest first)
    const friendDebts = debts
      .filter(d => d.from === isQuickPayingFriend)
      .sort((a, b) => a.daysPending - b.daysPending);
    
    let updatedBills = JSON.parse(JSON.stringify(data.bills)) as Bill[];

    // 2. เคลียร์หนี้ตัวเองก่อน
    for (const debt of friendDebts) {
      if (paymentLeft <= 0.01) break;
      const bIdx = updatedBills.findIndex(b => b.id === debt.billId);
      if (bIdx === -1) continue;
      
      const pIdx = updatedBills[bIdx].participants.findIndex(p => p.friendId === isQuickPayingFriend);
      if (pIdx === -1) continue;

      const participant = updatedBills[bIdx].participants[pIdx];
      const remaining = debt.remaining;
      const pay = Math.min(paymentLeft, remaining);
      
      participant.amountPaid += pay;
      paymentLeft -= pay;
      
      updatedBills[bIdx].isSettled = updatedBills[bIdx].participants.every(p => {
        const pShare = p.shareAmount ?? (updatedBills[bIdx].totalAmount / updatedBills[bIdx].participants.length);
        return p.amountPaid >= pShare - 0.01;
      });
    }

    // 3. หากมีเงินเหลือ (Surplus) ให้นำไปหักลบหนี้ให้เพื่อนคนอื่นๆ เพื่อให้ "ยอดค้างร้านนั้นหายไป"
    // โดยเน้นเคลียร์บิลที่ยังไม่ Settled เรียงตามความเก่า
    if (paymentLeft > 0.01) {
      const unsettledBills = updatedBills
        .filter(b => !b.isSettled)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const bill of unsettledBills) {
        if (paymentLeft <= 0.01) break;
        
        const bIdx = updatedBills.findIndex(ub => ub.id === bill.id);
        if (bIdx === -1) continue;

        // หยอดเงินช่วยเพื่อนคนอื่นๆ ในบิลนี้ (ยกเว้นตัวเอง และยกเว้น Banker/คนจ่ายสำรอง)
        updatedBills[bIdx].participants = updatedBills[bIdx].participants.map(p => {
          if (paymentLeft <= 0.01) return p;
          if (p.friendId === isQuickPayingFriend || p.friendId === updatedBills[bIdx].payerId) return p;

          const pShare = p.shareAmount ?? (updatedBills[bIdx].totalAmount / updatedBills[bIdx].participants.length);
          const pRemaining = pShare - p.amountPaid;
          
          if (pRemaining > 0.01) {
            const extraPay = Math.min(paymentLeft, pRemaining);
            paymentLeft -= extraPay;
            return { ...p, amountPaid: p.amountPaid + extraPay };
          }
          return p;
        });

        // อัปเดตสถานะบิลอีกครั้ง
        updatedBills[bIdx].isSettled = updatedBills[bIdx].participants.every(p => {
          const pShare = p.shareAmount ?? (updatedBills[bIdx].totalAmount / updatedBills[bIdx].participants.length);
          return p.amountPaid >= pShare - 0.01;
        });
      }
    }

    persistData({ ...data, bills: updatedBills });
    setIsQuickPayingFriend(null);
    setPaymentAmount('');
  };

  const handleAiQuery = async (query?: string) => {
    setIsAiLoading(true);
    const res = await getSettlementAdvice(data, query);
    setAiAdvice(res);
    setIsAiLoading(false);
    setAiQuestion('');
  };

  const handleResetBillPayments = (billId: string) => {
    if (!confirm("ต้องการรีเซ็ตยอดจ่ายทั้งหมดในบิลนี้ให้เป็น 0 ใช่หรือไม่?")) return;
    const newData = {
      ...data,
      bills: data.bills.map(b => {
        if (b.id !== billId) return b;
        return {
          ...b,
          isSettled: false,
          participants: (b.participants || []).map(p => ({ ...p, amountPaid: 0 }))
        };
      })
    };
    persistData(newData);
    setEditingBillId(null);
  };

  const handleResetFriendDebts = (friendId: string) => {
    const friendName = getFriendName(friendId);
    if (!confirm(`ต้องการรีเซ็ตยอดที่ ${friendName} เคยจ่ายไปแล้วทั้งหมดให้กลับมาเป็นหนี้เหมือนเดิมใช่หรือไม่?`)) return;
    
    const newData = {
      ...data,
      bills: data.bills.map(b => {
        if (!b.participants) return b;
        const hasFriend = b.participants.some(p => p.friendId === friendId);
        if (!hasFriend) return b;
        
        const newParticipants = b.participants.map(p => 
          p.friendId === friendId ? { ...p, amountPaid: 0 } : p
        );
        
        const isAllPaid = newParticipants.every(p => {
          const pShare = p.shareAmount ?? (b.totalAmount / (newParticipants.length || 1));
          return p.amountPaid >= pShare - 0.01;
        });

        return { ...b, participants: newParticipants, isSettled: isAllPaid };
      })
    };
    
    persistData(newData);
    alert(`รีเซ็ตประวัติการจ่ายของ ${friendName} เรียบร้อยแล้ว`);
  };

  const handleCopyReceipt = () => {
    if (selectedReceiptFriends.length === 0) return;
    
    let text = "🧾 สรุปยอดค้างจ่าย\n";
    text += `วันที่: ${format(new Date(), 'dd MMMM yyyy', { locale: th })}\n\n`;
    
    const selectedDebts = debts.filter(d => selectedReceiptFriends.includes(d.from));
    const groupedByPayer: Record<string, DebtSummary[]> = {};
    
    selectedDebts.forEach(d => {
      if (!groupedByPayer[d.to]) groupedByPayer[d.to] = [];
      groupedByPayer[d.to].push(d);
    });

    Object.entries(groupedByPayer).forEach(([payerId, payerDebts]) => {
      text += `👤 จ่ายคืน: ${getFriendName(payerId)}\n`;
      const totalToPayer = payerDebts.reduce((sum, d) => sum + d.remaining, 0);
      
      payerDebts.forEach(d => {
        const bill = data.bills.find(b => b.id === d.billId);
        text += `- ${bill?.title || 'บิล'}: ฿${d.remaining.toLocaleString()}\n`;
      });
      
      text += `💰 ยอดรวม: ฿${totalToPayer.toLocaleString()}\n\n`;
    });

    text += "ขอบคุณครับ/ค่ะ 🙏";
    
    navigator.clipboard.writeText(text).then(() => {
      alert("คัดลอกสรุปยอดแล้ว!");
    });
  };

  const handleQuickAddFriend = () => {
    if (!quickAddName.trim()) return;
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const newFriend: Friend = { id: newId, name: quickAddName.trim() };
    const newData = { ...data, friends: [...data.friends, newFriend] };
    persistData(newData);
    setSelectedParticipants([...selectedParticipants, newFriend.id]);
    if (!inputPayer) setInputPayer(newFriend.id);
    setQuickAddName('');
  };


  const remainingForOthers = useMemo(() => {
    const total = parseFloat(inputAmount) || 0;
    const fixedSum = Object.keys(fixedShares).filter(id => selectedParticipants.includes(id)).reduce((sum, id) => sum + (parseFloat(fixedShares[id]) || 0), 0);
    const sharedCount = selectedParticipants.filter(id => !fixedShares[id] || fixedShares[id] === '').length;
    return sharedCount > 0 ? (total - fixedSum) / sharedCount : 0;
  }, [inputAmount, fixedShares, selectedParticipants]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-slate-400">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold animate-pulse tracking-widest uppercase text-slate-500">กำลังเชื่อมต่อข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0f172a] flex flex-col pb-24 relative shadow-2xl">
      <header className="p-6 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-[60] border-b border-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">DrinkSplit</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : usingCloud ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ระบบซิงค์ข้อมูล</p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)} 
              className="p-1 hover:bg-slate-800 rounded-full transition-colors border-2 border-transparent focus:border-purple-500/50"
            >
              {user ? (
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-purple-500/50" alt="user" />
              ) : (
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center"><ICONS.Users size={16} className="text-slate-400" /></div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200 text-left">
                <div className="px-4 py-2 border-b border-slate-700 mb-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">สวัสดี!</p>
                  <p className="text-xs font-black text-slate-200 truncate">{user?.displayName || 'บุคคลทั่วไป'}</p>
                </div>
                {!user ? (
                  <button onClick={login} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <ICONS.Users size={14} className="text-purple-400" /> ลงชื่อเข้าใช้ (Google)
                  </button>
                ) : (
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2">
                     ออกจากระบบ Google
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileMenu && <div className="fixed inset-0 z-50" onClick={() => setShowProfileMenu(false)}></div>}

      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">ยอดค้างจ่ายรวม</p>
                <div className="text-2xl font-black text-red-400">฿{totalOwed.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">เพื่อนในกลุ่ม</p>
                <div className="text-2xl font-black text-purple-400">{data.friends.length} คน</div>
              </div>
            </div>
            <section className="mb-8">
              <h2 className="text-xs font-black mb-4 uppercase tracking-widest text-slate-500 flex items-center gap-2"><ICONS.Users size={14} className="text-purple-500" /> บัญชีหนังหมา (รายคน)</h2>
              {friendSummaries.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/50">
                  <p className="text-slate-600 text-sm">ไม่มีใครติดหนี้ใครแล้วจ้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendSummaries.map((summary) => (
                    <div key={summary.friendId} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black">{summary.friendName.substring(0, 2)}</div>
                          <h3 className="text-sm font-black text-slate-100">{summary.friendName}</h3>
                        </div>
                        <p className="text-xs font-black text-red-400">รวม ฿{summary.total.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(summary.venues).map(([venueName, amount]) => (
                          <div key={venueName} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">{venueName}</span>
                            <span className="text-slate-100 font-bold">฿{amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs font-black mb-4 uppercase tracking-widest text-slate-500 flex items-center gap-2"><ICONS.Pending size={14} className="text-amber-500" /> บัญชีหนังหมา (รายร้าน)</h2>
              {dashboardSummaries.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/50">
                  <ICONS.Glass size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-600 text-sm">ยังไม่มีหนี้สินในห้องนี้</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardSummaries.map((summary) => (
                    <div key={summary.venueId} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2"><ICONS.Venue size={16} className="text-purple-400" /><h3 className="text-sm font-black text-slate-100">{summary.venueName}</h3></div>
                        <p className="text-xs font-black text-red-400">ค้างรวม ฿{summary.totalRemaining.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(summary.friendDebts).map(([friendId, amount]) => (
                          <div key={friendId} className="flex justify-between items-center text-xs">
                             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div><span className="text-slate-300 font-bold">{getFriendName(friendId)}</span></div>
                             <span className="text-slate-100 font-black">฿{amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'venues' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black tracking-tight">สถานที่เช็คอิน</h2>
              <button onClick={() => { setInputName(''); setIsAddingVenue(true); }} className="bg-purple-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-600/20">+ เพิ่มร้าน</button>
            </div>
            {data.venues.length === 0 ? <p className="text-center py-20 text-slate-700 text-sm">ยังไม่มีข้อมูลร้านค้า...</p> : data.venues.map(v => (
               <div key={v.id} className="bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 shadow-xl mb-4">
                  <div className="p-5 bg-slate-700/20 flex justify-between items-center border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg cursor-pointer" onClick={() => { setInputName(v.name); setIsRenamingVenue(v.id); }}><ICONS.Venue className="text-purple-400" size={20} /></div>
                      <div className="flex items-center gap-2"><h3 className="font-black text-slate-200">{v.name}</h3><button onClick={() => { setInputName(v.name); setIsRenamingVenue(v.id); }} className="p-1 text-slate-600 hover:text-purple-400"><ICONS.Info size={12} /></button></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setInputTitle(''); setInputAmount(''); setInputPayer(data.friends[0]?.id || ''); setSelectedParticipants(data.friends.map(f => f.id)); setFixedShares({}); setIsAddingBill(v.id); }} className="text-[10px] bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl font-black uppercase">บิลใหม่</button>
                      <button onClick={() => setVenueToDelete(v.id)} className="p-2 text-slate-500 hover:text-red-500"><ICONS.Delete size={16} /></button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                     {data.bills.filter(b => b.venueId === v.id).map(b => (
                       <div key={b.id} className="group flex justify-between items-center p-4 bg-slate-900/40 rounded-2xl border border-slate-700/30 hover:border-purple-500/50 cursor-pointer text-left" onClick={() => {
                         setEditingBillId(b.id); 
                         setInputTitle(b.title || ''); 
                         setInputAmount((b.totalAmount || 0).toString()); 
                         setInputPayer(b.payerId || ''); 
                         setSelectedParticipants((b.participants || []).map(p => p.friendId));
                         const fs: Record<string, string> = {};
                          (b.participants || []).forEach(p => { if (p.shareAmount !== undefined) fs[p.friendId] = p.shareAmount.toString(); });
                         setFixedShares(fs);
                       }}>
                          <div>
                            <p className="text-sm font-black text-slate-200">{b.title} <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-400 ml-2">✎</span></p>
                            <p className={`text-[9px] uppercase font-black mt-1 ${b.isSettled ? 'text-emerald-500' : 'text-amber-500'}`}>{b.isSettled ? '● จ่ายครบ' : '○ ยังค้าง'}</p>
                          </div>
                          <div className="text-right"><p className="text-base font-black text-slate-100">฿{b.totalAmount.toLocaleString()}</p><p className="text-[9px] text-slate-600 mt-0.5">{format(new Date(b.date), 'dd/MM/yy')}</p></div>
                       </div>
                     ))}
                  </div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black tracking-tight">สมาชิกตับแข็ง</h2>
              <button onClick={() => { setInputName(''); setIsAddingFriend(true); }} className="bg-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-600/20">+ เพิ่มเพื่อน</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {data.friends.map(f => {
                const friendTotalOwed = debts.filter(d => d.from === f.id).reduce((sum, d) => sum + d.remaining, 0);
                return (
                  <div key={f.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg flex justify-between items-center text-left">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center font-black text-purple-400 border border-slate-600 uppercase text-lg group relative overflow-hidden">{f.name.charAt(0)}<button onClick={() => { setInputName(f.name); setIsRenamingFriend(f.id); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center"><ICONS.Info size={14} className="text-white" /></button></div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2"><span className="font-black text-slate-100">{f.name}</span><button onClick={() => { setInputName(f.name); setIsRenamingFriend(f.id); }} className="p-1 text-slate-600"><ICONS.Info size={12} /></button></div>
                        <div className="mt-1 flex items-center gap-2">
                          {friendTotalOwed > 0.01 ? (
                            <>
                              <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-lg">ค้างรวม: ฿{friendTotalOwed.toLocaleString()}</span>
                              <button onClick={() => { setPaymentAmount(friendTotalOwed.toFixed(2)); setIsQuickPayingFriend(f.id); }} className="text-[9px] font-black text-emerald-500 uppercase hover:underline">จ่ายคืน</button>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">ไม่มีค้างชำระ</span>
                          )}
                          <button onClick={() => handleResetFriendDebts(f.id)} className="text-[9px] font-black text-slate-500 uppercase hover:text-amber-500 transition-colors ml-1">รีเซ็ตหนี้</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setFriendToDelete(f.id)} className="p-3 text-slate-600 hover:text-red-500"><ICONS.Delete size={20} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
             <div className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div className="flex flex-col items-center mb-8"><div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl rotate-3"><ICONS.Info className="text-white" size={32} /></div><h3 className="text-2xl font-black text-center">ปรึกษา AI DrinkSplit</h3><p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-widest font-black">สอบถามใครค้างอะไรยังไงได้เลย!</p></div>
               {aiAdvice && <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-700/50 mb-8 text-left text-xs leading-relaxed prose prose-invert max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in duration-500"><div className="whitespace-pre-wrap">{aiAdvice}</div></div>}
               <div className="space-y-4">
                 <div className="relative group"><input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="เช่น กอล์ฟค้างร้านไหนบ้าง?" className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-sm font-bold text-slate-100 outline-none focus:ring-4 focus:ring-purple-500/20" onKeyDown={(e) => e.key === 'Enter' && aiQuestion.trim() && handleAiQuery(aiQuestion)} /><button onClick={() => handleAiQuery(aiQuestion)} disabled={isAiLoading || !aiQuestion.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-purple-600 rounded-xl text-white shadow-lg disabled:opacity-50">{isAiLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <ICONS.Arrow size={18} />}</button></div>
                 <button onClick={() => handleAiQuery()} disabled={isAiLoading} className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-300 shadow-xl disabled:opacity-50">{isAiLoading ? 'กำลังวิเคราะห์...' : 'สรุปภาพรวมทั้งหมด'}</button>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black tracking-tight">สรุปบิลรายกลุ่ม</h2>
              <button 
                onClick={handleCopyReceipt} 
                disabled={selectedReceiptFriends.length === 0}
                className="bg-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                <ICONS.Payment size={14} /> คัดลอกสรุป
              </button>
            </div>

            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-xl">
              <p className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">เลือกเพื่อนที่ต้องการสรุปยอด</p>
              <div className="flex flex-wrap gap-2">
                {data.friends.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => {
                      if (selectedReceiptFriends.includes(f.id)) {
                        setSelectedReceiptFriends(selectedReceiptFriends.filter(id => id !== f.id));
                      } else {
                        setSelectedReceiptFriends([...selectedReceiptFriends, f.id]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                      selectedReceiptFriends.includes(f.id) 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedReceiptFriends.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {(() => {
                  const selectedDebts = debts.filter(d => selectedReceiptFriends.includes(d.from));
                  const groupedByPayer: Record<string, DebtSummary[]> = {};
                  selectedDebts.forEach(d => {
                    if (!groupedByPayer[d.to]) groupedByPayer[d.to] = [];
                    groupedByPayer[d.to].push(d);
                  });

                  if (Object.keys(groupedByPayer).length === 0) {
                    return (
                      <div className="text-center py-20 bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/50">
                        <ICONS.Settled size={48} className="mx-auto text-emerald-500/20 mb-4" />
                        <p className="text-slate-600 text-sm font-bold">ไม่มีหนี้ค้างชำระสำหรับกลุ่มที่เลือก</p>
                      </div>
                    );
                  }

                  return Object.entries(groupedByPayer).map(([payerId, payerDebts]) => {
                    const totalToPayer = payerDebts.reduce((sum, d) => sum + d.remaining, 0);
                    return (
                      <div key={payerId} className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="p-5 bg-slate-700/20 border-b border-slate-700/50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center font-black text-purple-400 border border-purple-500/20">{getFriendName(payerId).charAt(0)}</div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-black">จ่ายคืนให้</p>
                              <p className="text-sm font-black text-slate-100">{getFriendName(payerId)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-black">ยอดรวม</p>
                            <p className="text-lg font-black text-emerald-400">฿{totalToPayer.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {payerDebts.map(d => {
                            const bill = data.bills.find(b => b.id === d.billId);
                            return (
                              <div key={d.billId} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-2xl border border-slate-700/30">
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-xs font-black text-slate-200 truncate">{bill?.title || 'บิล'}</p>
                                  <p className="text-[9px] text-slate-500 font-bold">{getFriendName(d.from)} ค้าง</p>
                                </div>
                                <p className="text-xs font-black text-slate-100">฿{d.remaining.toLocaleString()}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {(isAddingBill || editingBillId) && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 my-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black">{editingBillId ? 'แก้ไขบิล' : 'รายละเอียดบิล'}</h3>
              <div className="flex gap-2">
                {editingBillId && (
                  <>
                    <button 
                      onClick={() => handleResetBillPayments(editingBillId)} 
                      title="รีเซ็ตยอดจ่ายในบิลนี้"
                      className="p-2 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-colors"
                    >
                      <ICONS.Pending size={18} />
                    </button>
                    <button 
                      onClick={() => { if (confirm('ลบบิลนี้?')) handleDeleteBill(editingBillId); }} 
                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      <ICONS.Delete size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4 text-left">
               <div><label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-wider">รายการ</label><input value={inputTitle} onChange={e => setInputTitle(e.target.value)} placeholder="เช่น ค่าเหล้า, กับข้าว" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" /></div>
               <div><label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-wider">จำนวนเงินรวม (บาท)</label><input type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-2xl font-black text-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none" /></div>
               <div><label className="text-[10px] text-slate-500 uppercase font-black mb-1 block tracking-wider">คนจ่ายสำรอง</label><select value={inputPayer} onChange={e => setInputPayer(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-200 focus:ring-4 focus:ring-emerald-500/10 outline-none"><option value="" disabled>เลือกคนจ่าย...</option>{data.friends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
               <div>
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider">คนหาร ({selectedParticipants.length})</label>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedParticipants(data.friends.map(f => f.id))} className="text-[8px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 active:scale-95 transition-all">เลือกทั้งหมด</button>
                        <button onClick={() => setSelectedParticipants([])} className="text-[8px] font-black text-slate-400 uppercase bg-slate-700/30 px-2 py-1 rounded-lg border border-slate-700 active:scale-95 transition-all">ยกเลิก</button>
                      </div>
                    </div>
                    <div className="text-right"><p className="text-[9px] text-slate-400 uppercase font-black">หารเฉลี่ย:</p><p className="text-[11px] text-emerald-400 font-black">฿{remainingForOthers.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div>
                 </div>

                 <div className="flex gap-2 mb-3">
                   <input 
                     value={quickAddName} 
                     onChange={e => setQuickAddName(e.target.value)}
                     placeholder="เพิ่มคนใหม่..."
                     className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-purple-500/50"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         handleQuickAddFriend();
                       }
                     }}
                   />
                   <button 
                     type="button"
                     onClick={handleQuickAddFriend}
                     className="bg-purple-600 p-2 rounded-xl text-white shadow-lg active:scale-95 transition-all"
                   >
                     <ICONS.Add size={16} />
                   </button>
                 </div>

                 <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                   {data.friends.map(f => (
                     <div key={f.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${selectedParticipants.includes(f.id) ? 'bg-purple-600/10 border-purple-500/30' : 'bg-slate-900 border-slate-700 opacity-60'}`}>
                        <input type="checkbox" checked={selectedParticipants.includes(f.id)} onChange={e => { if (e.target.checked) setSelectedParticipants([...selectedParticipants, f.id]); else setSelectedParticipants(selectedParticipants.filter(pid => pid !== f.id)); }} className="w-4 h-4 rounded border-slate-700 cursor-pointer" />
                        <span className="text-xs font-black truncate flex-1">{f.name}</span>
                        {selectedParticipants.includes(f.id) && (
                          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700">
                             <input type="number" placeholder="ยอดเงิน" value={fixedShares[f.id] || ''} onChange={(e) => setFixedShares({ ...fixedShares, [f.id]: e.target.value })} className="w-16 bg-transparent text-[10px] font-black text-emerald-400 text-right focus:outline-none" />
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setIsAddingBill(null); setEditingBillId(null); setFixedShares({}); }} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">ยกเลิก</button>
              <button 
                onClick={() => handleSaveBill(isAddingBill || undefined)} 
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all ${(!inputTitle || !inputAmount || !inputPayer || selectedParticipants.length === 0) ? 'bg-slate-700 text-slate-500' : 'bg-emerald-600 text-white'}`}
              >
                บันทึกบิล
              </button>
            </div>
          </div>
        </div>
      )}

      {isQuickPayingFriend && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 text-center">
          <div className="bg-slate-800 w-full max-w-xs rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-3">จ่ายคืนเงินค้าง</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed px-4">ระบุยอดเงินที่ <span className="text-white font-bold">{getFriendName(isQuickPayingFriend)}</span> นำมาคืน ยอดที่เกินจะช่วยเคลียร์บิลเพื่อนคนอื่นให้หายไปทันที</p>
            <div className="mb-8">
              <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block">ยอดที่ได้รับคืน (บาท)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 text-2xl font-black text-emerald-400 text-center outline-none focus:ring-4 focus:ring-emerald-500/10" autoFocus />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsQuickPayingFriend(null)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase hover:text-white transition-colors">ยกเลิก</button>
              <button onClick={handleQuickPayment} className="flex-1 py-4 bg-emerald-600 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">บันทึกการคืนเงิน</button>
            </div>
          </div>
        </div>
      )}

      {venueToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 text-center">
          <div className="bg-slate-800 w-full max-w-xs rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-black mb-3 text-red-400">ลบร้านค้านี้?</h3>
            <p className="text-xs text-slate-500 mb-8 leading-relaxed">ข้อมูลทั้งหมดและบิลในร้านนี้จะหายไปอย่างถาวร</p>
            <div className="flex gap-4">
              <button onClick={() => setVenueToDelete(null)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase">ยกเลิก</button>
              <button onClick={handleDeleteVenue} className="flex-1 py-4 bg-red-600 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">ลบทิ้ง</button>
            </div>
          </div>
        </div>
      )}

      {friendToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 text-center">
          <div className="bg-slate-800 w-full max-w-xs rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-black mb-3 text-red-400">ลบเพื่อนคนนี้?</h3>
            <p className="text-xs text-slate-500 mb-8 leading-relaxed">ข้อมูลหนี้จะยังอยู่เพื่อความถูกต้อง แต่ชื่อเพื่อนจะเปลี่ยนเป็น Unknown</p>
            <div className="flex gap-4">
              <button onClick={() => setFriendToDelete(null)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase">ยกเลิก</button>
              <button onClick={() => {
                const newData = { ...data, friends: data.friends.filter(f => f.id !== friendToDelete) };
                persistData(newData);
                setFriendToDelete(null);
              }} className="flex-1 py-4 bg-red-600 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">ลบทิ้ง</button>
            </div>
          </div>
        </div>
      )}

      {(isAddingFriend || isRenamingFriend) && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"><div className="bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl text-left"><h3 className="text-2xl font-black mb-2">{isRenamingFriend ? 'เปลี่ยนชื่อเพื่อน' : 'เพิ่มเพื่อนใหม่'}</h3><input value={inputName} onChange={e => setInputName(e.target.value)} placeholder="พิมพ์ชื่อ..." className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 mb-8 font-black outline-none" autoFocus /><div className="flex gap-4"><button onClick={() => { setIsAddingFriend(false); setIsRenamingFriend(null); }} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase">ยกเลิก</button><button onClick={isRenamingFriend ? handleRenameFriend : handleAddFriend} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">บันทึก</button></div></div></div>
      )}

      {(isAddingVenue || isRenamingVenue) && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 text-left"><div className="bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl"><h3 className="text-2xl font-black mb-2">{isRenamingVenue ? 'แก้ไขชื่อร้าน' : 'เพิ่มร้านใหม่'}</h3><input value={inputName} onChange={e => setInputName(e.target.value)} placeholder="ชื่อร้าน..." className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 mb-8 font-black outline-none" autoFocus /><div className="flex gap-4"><button onClick={() => { setIsAddingVenue(false); setIsRenamingVenue(null); }} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase">ยกเลิก</button><button onClick={isRenamingVenue ? handleRenameVenue : handleAddVenue} className="flex-1 py-4 bg-purple-600 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">บันทึก</button></div></div></div>
      )}

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0f172a]/90 backdrop-blur-2xl border-t border-slate-800/50 p-4 flex justify-around items-center z-40 pb-8 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {[
          { id: 'dashboard', icon: ICONS.Beer, label: 'หน้าแรก' },
          { id: 'venues', icon: ICONS.Venue, label: 'ร้านค้า' },
          { id: 'friends', icon: ICONS.Users, label: 'เพื่อน' },
          { id: 'receipt', icon: ICONS.Payment, label: 'สรุปบิล' },
          { id: 'ai', icon: ICONS.Info, label: 'AI' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-2 transition-all group px-4 py-1 relative`}>
            <tab.icon size={22} className={`transition-all ${activeTab === tab.id ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110' : 'text-slate-600 group-hover:text-slate-400'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-purple-400' : 'text-slate-600'}`}>{tab.label}</span>
            {activeTab === tab.id && <div className="absolute -bottom-1 w-6 h-1 bg-purple-500 rounded-full"></div>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
