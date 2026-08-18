'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react';
import styles from '@/modules/auth/styles/auth.module.css';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle} style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#a855f7' }}>
          <ShieldCheck size={32} />
        </div>

        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.description}>
          ระบบจัดการผู้ใช้ ฐานข้อมูล และ Whitelist เบอร์โทรศัพท์
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleAdminLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Admin Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', color: '#fff' }}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ Admin'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <Link href="/" className={styles.backLink} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
