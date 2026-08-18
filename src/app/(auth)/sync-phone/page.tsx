'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from '@/modules/auth/styles/auth.module.css';

export default function SyncPhonePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เช่น 0812345678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/sync-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถซิงค์เบอร์โทรศัพท์ได้');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Smartphone size={32} />
        </div>
        
        <h1 className={styles.title}>ซิงค์เบอร์โทรศัพท์</h1>
        <p className={styles.description}>
          กรุณาระบุเบอร์โทรศัพท์ของคุณเพื่อผูกกับบัญชี LINE และเชื่อมต่อประวัติการใช้งาน
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSync} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>เบอร์โทรศัพท์มือถือ</label>
            <input
              type="tel"
              placeholder="08X-XXX-XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={styles.input}
              autoFocus
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'กำลังบันทึก...' : 'เข้าสู่ระบบ Dashboard'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.footerNote}>
          <ShieldCheck size={16} />
          <span>ข้อมูลเบอร์โทรจะถูกจัดเก็บใน Supabase อย่างปลอดภัย</span>
        </div>
      </div>
    </div>
  );
}
