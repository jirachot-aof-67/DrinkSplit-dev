'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Beer, 
  Plus, 
  Users, 
  Store, 
  ArrowLeft, 
  Trash2, 
  Share2, 
  Utensils, 
  CheckCircle2, 
  Circle, 
  RotateCcw, 
  Receipt, 
  Eye, 
  X, 
  Check, 
  Gift
} from 'lucide-react';
import styles from './styles/drink-split.module.css';

interface CustomItem {
  id: string;
  name: string;
  price: number;
}

interface VenueMemberConfig {
  memberId: string;
  customItems: CustomItem[];
}

interface Venue {
  id: string;
  name: string;
  totalAmount: number | string;
  payerId: string;
  selectedMemberIds: string[];
  memberConfigs: Record<string, VenueMemberConfig>;
}

interface MasterMember {
  id: string;
  name: string;
  amountPaidSoFar: number;
}

export default function DrinkSplitModule() {
  const [activeTab, setActiveTab] = useState<'split' | 'summary'>('split');

  // Master Friends Pool (รายชื่อเพื่อน 8 คน คลีนๆ ไม่มีสถานะค้าง)
  const [masterFriends, setMasterFriends] = useState<MasterMember[]>([
    { id: '1', name: 'คุณ (Me)', amountPaidSoFar: 0 },
    { id: '2', name: 'บอล', amountPaidSoFar: 0 },
    { id: '3', name: 'เจมส์', amountPaidSoFar: 0 },
    { id: '4', name: 'นัท', amountPaidSoFar: 0 },
    { id: '5', name: 'กอล์ฟ', amountPaidSoFar: 0 },
    { id: '6', name: 'แพรว', amountPaidSoFar: 0 },
    { id: '7', name: 'เอก', amountPaidSoFar: 0 },
    { id: '8', name: 'ต้อม', amountPaidSoFar: 0 },
  ]);

  const [newFriendName, setNewFriendName] = useState('');

  // Venues (รายการร้าน) - หารเท่ากันตามคนที่ไป + บวกเฉพาะเมนูสั่งแยก
  const [venues, setVenues] = useState<Venue[]>([
    {
      id: 'v1',
      name: 'ร้าน A (ทองหล่อ บาร์)',
      totalAmount: 3600,
      payerId: '1',
      selectedMemberIds: ['1', '2', '3', '4'],
      memberConfigs: {},
    },
    {
      id: 'v2',
      name: 'ร้าน B (คาราโอเกะเอกมัย)',
      totalAmount: 2400,
      payerId: '2',
      selectedMemberIds: ['1', '2', '5', '6'],
      memberConfigs: {
        '5': { 
          memberId: '5', 
          customItems: [{ id: 'it-1', name: 'เฟรนช์ฟรายส์จัมโบ้', price: 200 }] 
        },
      },
    },
  ]);

  const [activeVenueId, setActiveVenueId] = useState<string>('v1');
  const [newVenueName, setNewVenueName] = useState('');
  const [promptPayPhone, setPromptPayPhone] = useState('081-234-5678');
  const [copied, setCopied] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Modal ดูรายละเอียดบิลรายบุคคล
  const [inspectMemberId, setInspectMemberId] = useState<string | null>(null);

  // Modal ระบุยอดเงินที่โอนจริง
  const [payModalFriendId, setPayModalFriendId] = useState<string | null>(null);
  const [inputPayAmount, setInputPayAmount] = useState<number | ''>('');

  // เมนูสั่งแยก Temp Input
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');

  // -------------------------------------------------------------
  // AUTO-SAVE & LOAD BY LOGGED IN ACCOUNT
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drinksplit_clean_session_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.venues) setVenues(parsed.venues);
        if (parsed.masterFriends) setMasterFriends(parsed.masterFriends);
        if (parsed.promptPayPhone) setPromptPayPhone(parsed.promptPayPhone);
      }
    } catch (e) {
      console.warn('LocalStorage load error', e);
    }
  }, []);

  const persistAccountData = (newVenues: Venue[], newFriends: MasterMember[]) => {
    setVenues(newVenues);
    setMasterFriends(newFriends);
    try {
      localStorage.setItem(
        'drinksplit_clean_session_data_v2',
        JSON.stringify({
          venues: newVenues,
          masterFriends: newFriends,
          promptPayPhone,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  };

  const currentVenue = venues.find((v) => v.id === activeVenueId) || venues[0];

  const handleAddMasterFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    const newF: MasterMember = { id: Date.now().toString(), name: newFriendName.trim(), amountPaidSoFar: 0 };
    const nextFriends = [...masterFriends, newF];
    persistAccountData(venues, nextFriends);
    setNewFriendName('');
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    const newV: Venue = {
      id: Date.now().toString(),
      name: newVenueName.trim(),
      totalAmount: 0,
      payerId: masterFriends[0]?.id || '1',
      selectedMemberIds: masterFriends.slice(0, 3).map((f) => f.id),
      memberConfigs: {},
    };
    const nextVenues = [...venues, newV];
    persistAccountData(nextVenues, masterFriends);
    setActiveVenueId(newV.id);
    setNewVenueName('');
  };

  const handleRemoveVenue = (venueId: string) => {
    if (venues.length <= 1) return;
    const nextVenues = venues.filter((v) => v.id !== venueId);
    persistAccountData(nextVenues, masterFriends);
    if (activeVenueId === venueId) {
      setActiveVenueId(nextVenues[0].id);
    }
  };

  const toggleMemberInVenue = (friendId: string) => {
    const isSelected = currentVenue.selectedMemberIds.includes(friendId);
    let nextSelected = isSelected
      ? currentVenue.selectedMemberIds.filter((id) => id !== friendId)
      : [...currentVenue.selectedMemberIds, friendId];

    if (nextSelected.length === 0) return;

    const nextVenues = venues.map((v) =>
      v.id === currentVenue.id ? { ...v, selectedMemberIds: nextSelected } : v
    );
    persistAccountData(nextVenues, masterFriends);
  };

  const addCustomItem = (friendId: string) => {
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) <= 0) return;
    const existing = currentVenue.memberConfigs[friendId] || { memberId: friendId, customItems: [] };
    const newItem: CustomItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      price: Number(newItemPrice),
    };
    const nextConfig = { ...existing, customItems: [...(existing.customItems || []), newItem] };
    const nextVenues = venues.map((v) =>
      v.id === currentVenue.id
        ? { ...v, memberConfigs: { ...v.memberConfigs, [friendId]: nextConfig } }
        : v
    );
    persistAccountData(nextVenues, masterFriends);
    setNewItemName('');
    setNewItemPrice('');
  };

  const removeCustomItem = (friendId: string, itemId: string) => {
    const existing = currentVenue.memberConfigs[friendId];
    if (!existing) return;
    const nextConfig = {
      ...existing,
      customItems: existing.customItems.filter((it) => it.id !== itemId),
    };
    const nextVenues = venues.map((v) =>
      v.id === currentVenue.id
        ? { ...v, memberConfigs: { ...v.memberConfigs, [friendId]: nextConfig } }
        : v
    );
    persistAccountData(nextVenues, masterFriends);
  };

  // -------------------------------------------------------------
  // CALCULATION LOGIC: หารเท่ากันตามคนที่ไปร้านนั้น + เมนูสั่งแยก
  // -------------------------------------------------------------
  const venueTotal = Number(currentVenue.totalAmount) || 0;
  const venueSelectedFriends = masterFriends.filter((f) =>
    currentVenue.selectedMemberIds.includes(f.id)
  );

  const venueCustomItemsTotal = venueSelectedFriends.reduce((sum, f) => {
    const cfg = currentVenue.memberConfigs[f.id];
    return sum + (cfg?.customItems?.reduce((iSum, it) => iSum + it.price, 0) || 0);
  }, 0);

  const venueSharedPool = Math.max(0, venueTotal - venueCustomItemsTotal);
  const equalBaseShare = venueSelectedFriends.length > 0 ? venueSharedPool / venueSelectedFriends.length : 0;

  const calculateMemberTotalInVenue = (friendId: string): number => {
    const cfg = currentVenue.memberConfigs[friendId];
    const personal = cfg?.customItems?.reduce((sum, it) => sum + it.price, 0) || 0;
    return Number((equalBaseShare + personal).toFixed(2));
  };

  // -------------------------------------------------------------
  // GRAND SUMMARY & OVERPAY SURPLUS RELIEF
  // -------------------------------------------------------------
  const getGrandSummary = () => {
    const rawOwed: Record<string, { total: number; venuesList: any[] }> = {};
    masterFriends.forEach((f) => {
      rawOwed[f.id] = { total: 0, venuesList: [] };
    });

    venues.forEach((v) => {
      const vSelected = masterFriends.filter((f) => v.selectedMemberIds.includes(f.id));
      const vCustomTotal = vSelected.reduce((sum, f) => {
        const cfg = v.memberConfigs[f.id];
        return sum + (cfg?.customItems?.reduce((iSum, it) => iSum + it.price, 0) || 0);
      }, 0);

      const vShared = Math.max(0, (Number(v.totalAmount) || 0) - vCustomTotal);
      const vBaseRate = vSelected.length > 0 ? vShared / vSelected.length : 0;

      vSelected.forEach((f) => {
        const cfg = v.memberConfigs[f.id];
        const personal = cfg?.customItems?.reduce((sum, it) => sum + it.price, 0) || 0;
        const total = Number((vBaseRate + personal).toFixed(2));

        if (total > 0) {
          rawOwed[f.id].total += total;
          rawOwed[f.id].venuesList.push({
            venueId: v.id,
            venueName: v.name,
            sharedAmount: Number(vBaseRate.toFixed(2)),
            customItems: cfg?.customItems || [],
            totalInVenue: total,
          });
        }
      });
    });

    // คำนวณยอดเงินที่จ่ายเกิน (Surplus Pool) ที่หน้าสรุป
    let totalSurplusPool = 0;
    masterFriends.forEach((f) => {
      const baseTotal = rawOwed[f.id].total;
      const paid = f.amountPaidSoFar || 0;
      if (paid > baseTotal && baseTotal > 0) {
        totalSurplusPool += (paid - baseTotal);
      }
    });

    // นำเงินส่วนเกินไปช่วยเฉลี่ยลดยอดให้คนที่ยังค้างชำระ
    const unpaidFriends = masterFriends.filter((f) => {
      const baseTotal = rawOwed[f.id].total;
      const paid = f.amountPaidSoFar || 0;
      return baseTotal > 0 && paid < baseTotal;
    });

    const discountPerUnpaid = unpaidFriends.length > 0 && totalSurplusPool > 0
      ? totalSurplusPool / unpaidFriends.length
      : 0;

    const summary: Record<
      string,
      {
        member: MasterMember;
        baseOwed: number;
        surplusDiscount: number;
        finalOwed: number;
        amountPaid: number;
        remainingDebt: number;
        overpaidAmount: number;
        isSettled: boolean;
        venuesList: any[];
      }
    > = {};

    masterFriends.forEach((f) => {
      const base = rawOwed[f.id].total;
      const paid = f.amountPaidSoFar || 0;
      let discount = 0;

      if (paid < base && base > 0) {
        discount = Math.min(discountPerUnpaid, base - paid);
      }

      const finalOwed = Math.max(0, base - discount);
      const remaining = Math.max(0, finalOwed - paid);
      const overpaid = paid > base ? paid - base : 0;
      const isSettled = base > 0 && (paid >= finalOwed || remaining <= 0.01);

      summary[f.id] = {
        member: f,
        baseOwed: Number(base.toFixed(2)),
        surplusDiscount: Number(discount.toFixed(2)),
        finalOwed: Number(finalOwed.toFixed(2)),
        amountPaid: paid,
        remainingDebt: Number(remaining.toFixed(2)),
        overpaidAmount: Number(overpaid.toFixed(2)),
        isSettled,
        venuesList: rawOwed[f.id].venuesList,
      };
    });

    return { summary, totalSurplusPool };
  };

  const { summary: grandSummaryData, totalSurplusPool } = getGrandSummary();
  const totalAllVenuesAmount = venues.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  const totalActualCollected = masterFriends.reduce((sum, f) => sum + (f.amountPaidSoFar || 0), 0);
  const totalRemainingToCollect = Math.max(0, totalAllVenuesAmount - totalActualCollected);

  const inspectedMemberData = inspectMemberId ? grandSummaryData[inspectMemberId] : null;

  const handlePayExact = (friendId: string) => {
    const data = grandSummaryData[friendId];
    if (!data) return;

    const isCurrentlySettled = data.isSettled;
    const nextFriends = masterFriends.map((f) =>
      f.id === friendId
        ? { ...f, amountPaidSoFar: isCurrentlySettled ? 0 : data.finalOwed }
        : f
    );
    persistAccountData(venues, nextFriends);
  };

  const openCustomPayModal = (friendId: string) => {
    const data = grandSummaryData[friendId];
    setPayModalFriendId(friendId);
    setInputPayAmount(data?.amountPaid || '');
  };

  const saveCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalFriendId) return;

    const payVal = Number(inputPayAmount) || 0;
    const nextFriends = masterFriends.map((f) =>
      f.id === payModalFriendId ? { ...f, amountPaidSoFar: payVal } : f
    );
    persistAccountData(venues, nextFriends);
    setPayModalFriendId(null);
    setInputPayAmount('');
  };

  const handleCopyGrandLine = () => {
    let text = `🍻 สรุปยอดหารค่าเหล้า (${venues.length} ร้าน)\n`;
    text += `💰 ยอดรวมทั้งสิ้น: ฿${totalAllVenuesAmount.toLocaleString()} บาท (เก็บแล้ว ฿${totalActualCollected.toLocaleString()} / ค้าง ฿${totalRemainingToCollect.toLocaleString()})\n`;
    text += `📱 PromptPay: ${promptPayPhone}\n\n`;

    if (totalSurplusPool > 0) {
      text += `✨ มีเพื่อนโอนเกินช่วยรวม ฿${totalSurplusPool.toLocaleString()} บาท (ช่วยลดยอดให้เพื่อนคนอื่น!)\n\n`;
    }

    text += `📋 สถานะการชำระเงินรายคน:\n`;

    masterFriends.forEach((f) => {
      const data = grandSummaryData[f.id];
      if (data && data.baseOwed > 0) {
        if (data.overpaidAmount > 0) {
          text += `👑 ${f.name} -> จ่ายแล้ว ฿${data.amountPaid.toLocaleString()} (ช่วยเพื่อน +฿${data.overpaidAmount.toLocaleString()})\n`;
        } else if (data.isSettled) {
          text += `✅ ${f.name} -> จ่ายครบแล้ว (฿${data.amountPaid.toLocaleString()})\n`;
        } else {
          text += `⏳ ${f.name} -> ค้างโอน ฿${data.remainingDebt.toFixed(2)} บาท`;
          if (data.surplusDiscount > 0) text += ` (ได้ลด ฿${data.surplusDiscount.toFixed(2)} จากเพื่อนช่วย)`;
          if (data.amountPaid > 0) text += ` [โอนแล้ว ฿${data.amountPaid}]`;
          text += `\n`;
        }
      }
    });

    text += `\nขอบคุณทุกคนมากครับ โอนแล้วแจ้งสลิปในกลุ่มได้เลย 🙏✨`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </Link>
        <div className={styles.navTabs}>
          <button 
            onClick={() => setActiveTab('split')} 
            className={`${styles.tabBtn} ${activeTab === 'split' ? styles.tabActive : ''}`}
          >
            🍻 จัดการหารบิลรายร้าน
          </button>
          <button 
            onClick={() => setActiveTab('summary')} 
            className={`${styles.tabBtn} ${activeTab === 'summary' ? styles.tabActive : ''}`}
          >
            📊 สรุปยอด & ชำระเงิน
          </button>
        </div>
      </header>

      {/* Main Single Column Layout */}
      <main className={styles.mobileContainer}>
        {activeTab === 'split' ? (
          /* ========================================================= */
          /* TAB 1: MANAGE VENUES & SPLITTING                          */
          /* ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
            
            {/* Horizontal Venue Scroll Tabs */}
            <div style={{ overflowX: 'auto', display: 'flex', gap: '0.5rem', paddingBottom: '0.25rem' }}>
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVenueId(v.id)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: activeVenueId === v.id ? 'var(--gradient-dev)' : 'rgba(255,255,255,0.05)',
                    color: activeVenueId === v.id ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    border: `1px solid ${activeVenueId === v.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <Store size={14} />
                  <span>{v.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({v.selectedMemberIds.length} คน)</span>
                </button>
              ))}
            </div>

            {/* Add New Venue Input */}
            <form onSubmit={handleAddVenue} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="+ เพิ่มร้านใหม่ (เช่น ร้าน B, คาราโอเกะ)..."
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.9rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0 1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                + เพิ่มร้าน
              </button>
            </form>

            {/* Current Venue Card */}
            <div className={styles.card} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <Store size={20} color="#00f2fe" />
                  <input
                    type="text"
                    value={currentVenue.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextVenues = venues.map((v) => (v.id === currentVenue.id ? { ...v, name: val } : v));
                      persistAccountData(nextVenues, masterFriends);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                {venues.length > 1 && (
                  <button
                    onClick={() => handleRemoveVenue(currentVenue.id)}
                    style={{ color: 'var(--accent-rose)', padding: '0.25rem' }}
                    title="ลบร้านนี้"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Bill Amount Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  💰 ยอดรวมบิลของร้านนี้ (บาท)
                </label>
                <input
                  type="number"
                  value={currentVenue.totalAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    const nextVenues = venues.map((v) => (v.id === currentVenue.id ? { ...v, totalAmount: val } : v));
                    persistAccountData(nextVenues, masterFriends);
                  }}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1.6rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-active)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-cyan)',
                  }}
                />
              </div>

              {/* Member Selection Chips */}
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  👥 ใครมาร้านนี้บ้าง? (แตะเลือก {currentVenue.selectedMemberIds.length}/{masterFriends.length} คน):
                </span>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {masterFriends.map((f) => {
                    const isChecked = currentVenue.selectedMemberIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleMemberInVenue(f.id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: isChecked ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isChecked ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                          color: isChecked ? '#00f2fe' : 'var(--text-muted)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isChecked ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        <span>{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clean Attending Members List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    สมาชิกที่มาร้านนี้ ({venueSelectedFriends.length} คน):
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เลื่อนขึ้นลงได้ ↕️</span>
                </div>

                <div 
                  style={{ 
                    maxHeight: '360px', 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.6rem',
                    paddingRight: '0.25rem',
                  }}
                >
                  {venueSelectedFriends.map((f) => {
                    const cfg = currentVenue.memberConfigs[f.id] || { memberId: f.id, customItems: [] };
                    const share = calculateMemberTotalInVenue(f.id);
                    const isExpanded = expandedMemberId === f.id;

                    return (
                      <div
                        key={f.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 0.9rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{f.name}</strong>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.15rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                              ฿{share.toFixed(2)}
                            </strong>

                            <button
                              type="button"
                              onClick={() => setExpandedMemberId(isExpanded ? null : f.id)}
                              style={{
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                background: cfg.customItems?.length > 0 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${cfg.customItems?.length > 0 ? '#a855f7' : 'var(--border-subtle)'}`,
                                color: cfg.customItems?.length > 0 ? '#c084fc' : 'var(--text-muted)',
                              }}
                            >
                              🍽️ สั่งกินเอง ({cfg.customItems?.length || 0})
                            </button>
                          </div>
                        </div>

                        {/* Custom Menu expand */}
                        {isExpanded && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                            {cfg.customItems?.map((it) => (
                              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.2rem 0' }}>
                                <span>• {it.name}</span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <strong style={{ color: 'var(--accent-emerald)' }}>+฿{it.price}</strong>
                                  <button onClick={() => removeCustomItem(f.id, it.id)} style={{ color: 'var(--text-muted)' }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                              <input
                                type="text"
                                placeholder="ชื่อเมนู..."
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                style={{ flex: 2, padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                              />
                              <input
                                type="number"
                                placeholder="ราคา..."
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                              />
                              <button
                                type="button"
                                onClick={() => addCustomItem(f.id)}
                                style={{ padding: '0.3rem 0.6rem', background: 'var(--gradient-emerald)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Master Friends Manager */}
            <div className={styles.card} style={{ padding: '1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                👥 จัดการรายชื่อเพื่อนทั้งหมดในทริป ({masterFriends.length} คน)
              </h4>
              <form onSubmit={handleAddMasterFriend} style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="+ พิมพ์ชื่อเพื่อนเพิ่ม..."
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    fontSize: '0.85rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0 0.9rem',
                    background: 'var(--gradient-emerald)',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  เพิ่ม
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* TAB 2: SUMMARY & REALTIME PAYMENT / SURPLUS TRACKER       */
          /* ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
            
            {/* Grand Summary Card */}
            <div className={styles.card} style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ยอดรวมค่าใช้จ่ายทั้งหมด ({venues.length} ร้าน)
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'monospace', margin: '0.4rem 0' }}>
                ฿{totalAllVenuesAmount.toLocaleString()}
              </div>

              {/* Progress Tracker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>โอนเงินเข้ามาแล้ว:</span>
                  <strong style={{ color: '#10b981', fontSize: '1.1rem', fontFamily: 'monospace' }}>฿{totalActualCollected.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>คงเหลือค้างโอน:</span>
                  <strong style={{ color: totalRemainingToCollect > 0 ? '#f87171' : '#10b981', fontSize: '1.1rem', fontFamily: 'monospace' }}>
                    {totalRemainingToCollect > 0 ? `฿${totalRemainingToCollect.toLocaleString()}` : 'ครบแล้ว 🎉'}
                  </strong>
                </div>
              </div>

              {/* Surplus Notification Banner */}
              {totalSurplusPool > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                  <Gift size={18} color="#fcd34d" />
                  <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>
                    <strong>มีเพื่อนโอนเกินมา ฿{totalSurplusPool.toLocaleString()} บาท!</strong> นำไปช่วยเฉลี่ยลดยอดให้เพื่อนคนอื่นที่เหลือเรียบร้อย 🎉
                  </div>
                </div>
              )}
            </div>

            {/* Per-Person Payment Tracker List */}
            <div className={styles.card} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  📋 สรุปยอดโอนรายคน (รวมทุกร้าน)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  แตะใส่ยอดที่โอนจริงได้
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {masterFriends.map((f) => {
                  const data = grandSummaryData[f.id];
                  const hasDebts = data && data.baseOwed > 0;
                  const isSettled = data?.isSettled;
                  const isOverpaid = data && data.overpaidAmount > 0;

                  return (
                    <div 
                      key={f.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        background: isOverpaid ? 'rgba(245, 158, 11, 0.1)' : isSettled ? 'rgba(16, 185, 129, 0.08)' : hasDebts ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                        border: `1px solid ${isOverpaid ? 'rgba(245, 158, 11, 0.5)' : isSettled ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {/* Left: Avatar & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div 
                          style={{ 
                            width: '34px', 
                            height: '34px', 
                            borderRadius: '50%', 
                            background: isOverpaid ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : isSettled ? 'var(--gradient-emerald)' : 'var(--bg-tertiary)', 
                            color: isOverpaid || isSettled ? '#000' : '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 800, 
                            fontSize: '0.85rem' 
                          }}
                        >
                          {isOverpaid ? '👑' : isSettled ? <Check size={16} /> : f.name[0]}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>{f.name}</span>
                            {isOverpaid && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', borderRadius: '9999px', fontWeight: 800 }}>👑 โอนเกิน +฿{data.overpaidAmount}</span>}
                            {isSettled && !isOverpaid && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', borderRadius: '9999px', fontWeight: 800 }}>จ่ายครบแล้ว</span>}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {hasDebts ? `ยอดเต็ม ฿${data.baseOwed.toFixed(2)}` : 'ไม่ได้ไปร้านไหนเลย'}
                            {data?.surplusDiscount > 0 && (
                              <span style={{ color: '#fcd34d', marginLeft: '0.3rem' }}>(ได้ลด ฿{data.surplusDiscount})</span>
                            )}
                            {data?.amountPaid > 0 && !isSettled && (
                              <span style={{ color: '#34d399', marginLeft: '0.3rem' }}>• โอนแล้ว ฿{data.amountPaid}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Remaining Debt & Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'monospace', color: isSettled ? 'var(--accent-emerald)' : hasDebts ? '#f87171' : 'var(--text-muted)' }}>
                            {isSettled ? '฿0.00' : `฿${data ? data.remainingDebt.toFixed(2) : '0.00'}`}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {isSettled ? 'เคลียร์แล้ว' : 'ยอดค้างโอน'}
                          </span>
                        </div>

                        {hasDebts && (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              onClick={() => handlePayExact(f.id)}
                              style={{
                                padding: '0.35rem 0.55rem',
                                background: isSettled ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.15)',
                                border: `1px solid ${isSettled ? 'var(--border-subtle)' : 'var(--border-neon)'}`,
                                borderRadius: 'var(--radius-sm)',
                                color: isSettled ? 'var(--text-muted)' : 'var(--accent-emerald)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                              title="สลับสถานะจ่ายครบ/ยังไม่จ่าย"
                            >
                              {isSettled ? 'รีเซ็ต' : '✓ ครบ'}
                            </button>

                            <button
                              onClick={() => openCustomPayModal(f.id)}
                              style={{
                                padding: '0.35rem 0.55rem',
                                background: isOverpaid ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${isOverpaid ? '#f59e0b' : 'var(--border-subtle)'}`,
                                borderRadius: 'var(--radius-sm)',
                                color: isOverpaid ? '#fcd34d' : 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                              title="ระบุยอดที่โอนจริง (เช่น นัทกิน 500 แต่โอนมา 1000)"
                            >
                              💵 ระบุยอด
                            </button>

                            <button
                              onClick={() => setInspectMemberId(f.id)}
                              style={{
                                padding: '0.35rem 0.45rem',
                                background: 'rgba(0, 242, 254, 0.1)',
                                border: '1px solid var(--border-active)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--accent-cyan)',
                              }}
                              title="ดูรายละเอียดบิล"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PromptPay & Share LINE Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className={styles.card} style={{ padding: '1rem 1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  เบอร์ PromptPay คนสำรองจ่าย (ใส่ในข้อความสรุป)
                </label>
                <input
                  type="text"
                  value={promptPayPhone}
                  onChange={(e) => setPromptPayPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <button
                onClick={handleCopyGrandLine}
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  background: '#06c755',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 25px rgba(6, 199, 85, 0.4)',
                }}
              >
                <Share2 size={20} />
                <span>{copied ? '✅ คัดลอกสรุปแล้ว! วางใน LINE ได้เลย' : 'คัดลอกสถานะการโอนส่งเข้า LINE'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: CUSTOM / OVERPAY PAYMENT                           */}
      {/* ========================================================= */}
      {payModalFriendId && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <button
              onClick={() => setPayModalFriendId(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 0.5rem' }}>
                💵
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>ระบุยอดที่โอนจริง</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {masterFriends.find(f => f.id === payModalFriendId)?.name}
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                ยอดหารของคนนี้: ฿{grandSummaryData[payModalFriendId]?.baseOwed.toFixed(2)} บาท
              </div>
            </div>

            <form onSubmit={saveCustomPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  จำนวนเงินที่โอนเข้ามาจริง (บาท):
                </label>
                <input 
                  type="number"
                  value={inputPayAmount}
                  onChange={(e) => setInputPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="เช่น โอนมา 1000"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-active)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fcd34d',
                    textAlign: 'center',
                  }}
                  autoFocus
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  💡 ถ้าโอนมาเกินยอดจริง (เช่น กิน 500 แต่โอนมา 1000) ยอดส่วนเกินจะไปลดหนี้ให้เพื่อนๆ คนอื่นให้อัตโนมัติทันที
                </span>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'var(--gradient-emerald)',
                  color: '#fff',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                }}
              >
                บันทึกยอดเงิน ➜
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INDIVIDUAL MEMBER BREAKDOWN (ดูบิลรายคน)           */}
      {/* ========================================================= */}
      {inspectedMemberData && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <button
              onClick={() => setInspectMemberId(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-dev)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 0.5rem' }}>
                {inspectedMemberData.member.name[0]}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>บิลของ {inspectedMemberData.member.name}</h2>
              
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                ฿{inspectedMemberData.finalOwed.toFixed(2)} บาท
              </div>

              {inspectedMemberData.surplusDiscount > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#fcd34d', marginTop: '0.2rem' }}>
                  ✨ ได้รับส่วนลด ฿{inspectedMemberData.surplusDiscount.toFixed(2)} (จากเพื่อนที่โอนเกิน)
                </div>
              )}

              {inspectedMemberData.amountPaid > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                  โอนแล้ว ฿{inspectedMemberData.amountPaid.toFixed(2)} {inspectedMemberData.overpaidAmount > 0 ? `(โอนเกิน +฿${inspectedMemberData.overpaidAmount})` : `(ค้าง ฿${inspectedMemberData.remainingDebt.toFixed(2)})`}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {inspectedMemberData.venuesList.map((vb) => (
                <div 
                  key={vb.venueId}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>📍 {vb.venueName}</strong>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>
                      ฿{vb.totalInVenue.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ส่วนแบ่งกองกลาง:</span>
                      <span style={{ fontFamily: 'monospace' }}>฿{vb.sharedAmount.toFixed(2)}</span>
                    </div>

                    {vb.customItems.map((it: any) => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc' }}>
                        <span>• สั่งแยก: {it.name}</span>
                        <span style={{ fontFamily: 'monospace' }}>+฿{it.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInspectMemberId(null)}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
