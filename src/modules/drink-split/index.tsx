'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Beer, 
  Plus, 
  Users, 
  Receipt, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import styles from './styles/drink-split.module.css';
import { Friend, Bill, DebtSummary } from './types';

export default function DrinkSplitModule() {
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', name: 'คุณ (Me)', phone: '081-234-5678' },
    { id: '2', name: 'บอล (สายแข็ง)', phone: '089-876-5432' },
    { id: '3', name: 'เจมส์ (คนขับรถ)', phone: '086-111-2222' },
  ]);

  const [newFriendName, setNewFriendName] = useState('');
  const [billTitle, setBillTitle] = useState('โต๊ะ VIP ปาร์ตี้วันศุกร์');
  const [totalAmount, setTotalAmount] = useState<number | ''>(2400);
  const [payerId, setPayerId] = useState('1');
  const [selectedFriends, setSelectedFriends] = useState<string[]>(['1', '2', '3']);

  const addFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: newFriendName.trim(),
    };
    setFriends([...friends, newFriend]);
    setSelectedFriends([...selectedFriends, newFriend.id]);
    setNewFriendName('');
  };

  const toggleFriend = (id: string) => {
    if (selectedFriends.includes(id)) {
      if (selectedFriends.length > 1) {
        setSelectedFriends(selectedFriends.filter((fId) => fId !== id));
      }
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  const calculatedSplit =
    typeof totalAmount === 'number' && selectedFriends.length > 0
      ? (totalAmount / selectedFriends.length).toFixed(2)
      : '0.00';

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </Link>
        <div className={styles.titleBox}>
          <Beer size={24} className={styles.headerIcon} />
          <h1>DrinkSplit Module</h1>
        </div>
        <div className={styles.headerBadge}>Next.js + Supabase</div>
      </header>

      {/* Main Split Layout */}
      <main className={styles.mainGrid}>
        {/* Left Column: Create Bill & Friends */}
        <section className={styles.leftCol}>
          {/* Bill Info Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Receipt size={20} className={styles.cardIcon} />
              <h2>ข้อมูลบิลค่าเหล้า</h2>
            </div>

            <div className={styles.formGroup}>
              <label>ชื่อบิล / ร้าน</label>
              <input
                type="text"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="เช่น ทองหล่อ บาร์"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>ยอดรวมค่าใช้จ่ายทั้งหมด (บาท)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className={`${styles.input} ${styles.inputPrice}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label>คนออกเงินสำรองจ่ายก่อน</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className={styles.select}
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Users size={20} className={styles.cardIcon} />
              <h2>เพื่อนร่วมวง ({selectedFriends.length}/{friends.length} คน)</h2>
            </div>

            {/* Quick Add Friend */}
            <form onSubmit={addFriend} className={styles.addFriendForm}>
              <input
                type="text"
                placeholder="+ เพิ่มเพื่อนใหม่..."
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.addBtn}>
                <Plus size={18} />
              </button>
            </form>

            <div className={styles.friendList}>
              {friends.map((f) => {
                const isSelected = selectedFriends.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFriend(f.id)}
                    className={`${styles.friendItem} ${isSelected ? styles.friendSelected : ''}`}
                  >
                    <div className={styles.friendAvatar}>{f.name[0]}</div>
                    <div className={styles.friendName}>{f.name}</div>
                    <div className={styles.checkBadge}>
                      {isSelected ? <CheckCircle size={16} /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Split Breakdown & Summary */}
        <section className={styles.rightCol}>
          <div className={`${styles.card} ${styles.summaryCard}`}>
            <div className={styles.cardHeader}>
              <CreditCard size={20} className={styles.cardIcon} />
              <h2>สรุปยอดเฉลี่ยรายคน</h2>
            </div>

            <div className={styles.bigAmountBox}>
              <span className={styles.amountLabel}>หารเฉลี่ยคนละ</span>
              <div className={styles.bigAmount}>
                ฿{calculatedSplit}
                <span className={styles.perPerson}>/ คน</span>
              </div>
              <span className={styles.totalBadge}>
                ยอดรวมทั้งหมด ฿{totalAmount || 0} ({selectedFriends.length} คน)
              </span>
            </div>

            {/* Breakdown per friend */}
            <div className={styles.breakdownList}>
              <h3 className={styles.breakdownTitle}>รายละเอียดการชำระคืน:</h3>
              {selectedFriends.map((fId) => {
                const friend = friends.find((f) => f.id === fId);
                const isPayer = fId === payerId;
                return (
                  <div key={fId} className={styles.breakdownItem}>
                    <div className={styles.breakdownName}>
                      {friend?.name}
                      {isPayer && <span className={styles.payerTag}>ผู้สำรองจ่าย</span>}
                    </div>
                    <div className={styles.breakdownAmount}>
                      {isPayer ? (
                        <span className={styles.textGreen}>รับเงินคืน ฿{((Number(totalAmount) || 0) - Number(calculatedSplit)).toFixed(2)}</span>
                      ) : (
                        <span className={styles.textOrange}>ต้องโอน ฿{calculatedSplit}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className={styles.saveBillBtn}>
              💾 บันทึกบิลลง Supabase PostgreSQL
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
