'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Smartphone, 
  Plus, 
  LogOut, 
  Search, 
  ArrowLeft,
  Database,
  CheckCircle2,
  Clock
} from 'lucide-react';
import styles from '@/modules/dashboard/styles/dashboard.module.css';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setProfiles(data.profiles || []);
      setPhones(data.phones || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone) return;

    try {
      setMsg('');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newPhone,
          note: newNote,
          assignedRole: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg('✅ เพิ่มเบอร์ Whitelist สำเร็จ!');
      setNewPhone('');
      setNewNote('');
      fetchData();
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <ShieldCheck size={26} color="#a855f7" />
          <span>ADMIN<span className="text-gradient">PANEL</span></span>
          <span className={styles.badge} style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#a855f7' }}>SUPER ADMIN</span>
        </div>

        <div className={styles.userProfile}>
          <Link href="/dashboard" className={styles.logoutBtn} title="ไปหน้า Dashboard ทั่วไป">
            <ArrowLeft size={18} />
          </Link>
          <Link href="/" className={styles.logoutBtn} title="ออกจากระบบ">
            <LogOut size={18} />
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Welcome */}
        <div className={styles.welcomeBanner} style={{ borderLeft: '4px solid #a855f7' }}>
          <div>
            <h1>ระบบจัดการผู้ใช้ & เบอร์โทร (Whitelist)</h1>
            <p>เพิ่มเบอร์โทรศัพท์เพื่อให้ระบบ Auto-Sync สิทธิ์และข้อมูลอัตโนมัติเมื่อผู้ใช้ Login ด้วย LINE</p>
          </div>
          <button onClick={fetchData} className={styles.statusBox} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            🔄 รีเฟรชข้อมูล
          </button>
        </div>

        {/* Add Whitelist Form */}
        <div style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} color="#00f2fe" />
            เพิ่มเบอร์โทรล่วงหน้า (Pre-Authorized Whitelist)
          </h3>

          {msg && <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: msg.startsWith('✅') ? '#34d399' : '#f87171' }}>{msg}</p>}

          <form onSubmit={handleAddPhone} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>เบอร์โทรศัพท์</label>
              <input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>บันทึกช่วยจำ (Note / ชื่อ)</label>
              <input
                type="text"
                placeholder="เช่น เบอร์พี่อ๊อฟ, ทีมงาน"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>สิทธิ์ที่มอบให้ (Role)</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#11131c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              >
                <option value="user">User (ผู้ใช้ทั่วไป)</option>
                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
              </select>
            </div>

            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', color: '#fff', fontWeight: 700, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> เพิ่มเบอร์
            </button>
          </form>
        </div>

        {/* Data Tables Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
          {/* Whitelist Phones */}
          <div style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={20} color="#a855f7" />
              รายการเบอร์ใน Whitelist ({phones.length})
            </h3>

            {phones.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีเบอร์ใน Whitelist</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {phones.map((ph) => (
                  <div key={ph.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#00f2fe' }}>{ph.phone_number}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ph.note || 'ไม่มีโน้ต'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: ph.assigned_role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', color: ph.assigned_role === 'admin' ? '#c084fc' : 'var(--text-secondary)' }}>
                        {ph.assigned_role}
                      </span>
                      {ph.is_linked ? (
                        <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={14} /> ซิงค์แล้ว
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={14} /> รอล็อกอิน
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Profiles */}
          <div style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#10b981" />
              ผู้ใช้งานในระบบ Supabase ({profiles.length})
            </h3>

            {profiles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีผู้ใช้ลงทะเบียน</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profiles.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.picture_url ? (
                        <img src={p.picture_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                          {p.display_name?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.display_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          📱 {p.phone_number || 'ยังไม่ระบุ'} • {p.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
