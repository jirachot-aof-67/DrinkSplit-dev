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
  CheckCircle2, 
  Clock, 
  Sliders, 
  RefreshCw, 
  Sparkles,
  LayoutTemplate
} from 'lucide-react';
import styles from '@/modules/dashboard/styles/dashboard.module.css';
import ResumeEditorModal from '@/modules/resume/components/ResumeEditorModal';
import { defaultResumeData, ResumeData } from '@/modules/resume/types/resume';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [msg, setMsg] = useState('');

  // Landing config states
  const [landingMode, setLandingMode] = useState<'default' | 'resume'>('resume');
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, configRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/landing-config'),
      ]);

      const userData = await userRes.json();
      setProfiles(userData.profiles || []);
      setPhones(userData.phones || []);

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.mode) setLandingMode(configData.mode);
        if (configData.resumeData) setResumeData(configData.resumeData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLandingMode = async (newMode: 'default' | 'resume') => {
    setModeSaving(true);
    setLandingMode(newMode);
    try {
      await fetch('/api/admin/landing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      setMsg(`✅ สลับโหมดหน้าแรกเป็น: ${newMode === 'resume' ? 'Portfolio / Resume' : 'DrinkSplit ปกติ'} เรียบร้อย!`);
    } catch (err: any) {
      setMsg(`❌ ไม่สามารถเปลี่ยนโหมดได้: ${err.message}`);
    } finally {
      setModeSaving(false);
    }
  };

  const handleSaveResumeData = async (newData: ResumeData) => {
    setResumeData(newData);
    try {
      await fetch('/api/admin/landing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: newData }),
      });
      setMsg('✅ บันทึกข้อมูลเรซูเม่เรียบร้อย!');
    } catch (err: any) {
      setMsg(`❌ บันทึกข้อมูลไม่สำเร็จ: ${err.message}`);
    }
  };

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
          <Link href="/" className={styles.logoutBtn} title="ไปยังหน้าแรก">
            <LayoutTemplate size={18} />
          </Link>
          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/';
            }} 
            className={styles.logoutBtn} 
            title="ออกจากระบบ (Logout)"
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Welcome */}
        <div className={styles.welcomeBanner} style={{ borderLeft: '4px solid #a855f7' }}>
          <div>
            <h1>ระบบจัดการผู้ดูแลระบบ (Admin Console)</h1>
            <p>สลับโหมดหน้าแรก, ปรับแต่งเรซูเม่โปรไฟล์ และจัดการ Whitelist เบอร์โทรศัพท์</p>
          </div>
          <button onClick={fetchData} className={styles.statusBox} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            🔄 รีเฟรชข้อมูล
          </button>
        </div>

        {/* Status Message */}
        {msg && (
          <div style={{ padding: '0.85rem 1.2rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)', background: msg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', border: msg.startsWith('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)', color: msg.startsWith('✅') ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* 🌟 1. Landing Page Mode Controller */}
        <div style={{ background: 'linear-gradient(135deg, rgba(25, 28, 40, 0.8) 0%, rgba(17, 19, 28, 0.95) 100%)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-md)', padding: '1.8rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <LayoutTemplate size={24} color="#00f2fe" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>ระบบสลับหน้าแรก (Landing Mode Switcher)</h3>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: landingMode === 'resume' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(168, 85, 247, 0.2)', color: landingMode === 'resume' ? '#00f2fe' : '#c084fc', border: '1px solid currentColor' }}>
                  {landingMode === 'resume' ? '✨ โหมด PORTFOLIO / RESUME' : '🍻 โหมด DRINKSPLIT ปกติ'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                เลือกหน้าที่ต้องการให้ทุกคนเห็นเมื่อเข้าเว็บ (<code>/</code>) — คนทั่วไปจะเห็นโหมดที่คุณเลือกโดยอัตโนมัติ
              </p>
            </div>

            {/* Switch Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => handleToggleLandingMode('resume')}
                disabled={modeSaving || landingMode === 'resume'}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: landingMode === 'resume' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'rgba(255,255,255,0.05)',
                  color: landingMode === 'resume' ? '#000' : '#d1d5db',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: landingMode === 'resume' ? 'none' : '1px solid var(--border-subtle)',
                  cursor: landingMode === 'resume' ? 'default' : 'pointer',
                }}
              >
                <Sparkles size={16} />
                <span>โหมด Resume โปรไฟล์</span>
              </button>

              <button
                onClick={() => handleToggleLandingMode('default')}
                disabled={modeSaving || landingMode === 'default'}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: landingMode === 'default' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: landingMode === 'default' ? 'none' : '1px solid var(--border-subtle)',
                  cursor: landingMode === 'default' ? 'default' : 'pointer',
                }}
              >
                <span>🍻 โหมด DrinkSplit ปกติ</span>
              </button>

              <button
                onClick={() => setIsEditorOpen(true)}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Sliders size={16} />
                <span>แก้ไขข้อมูลเรซูเม่ / รูปภาพ</span>
              </button>

              <Link
                href="/"
                target="_blank"
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                👁️ เปิดดูหน้าแรก
              </Link>
            </div>
          </div>
        </div>

        {/* 🌟 2. Add Whitelist Form */}
        <div style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} color="#00f2fe" />
            เพิ่มเบอร์โทรล่วงหน้า (Pre-Authorized Whitelist)
          </h3>

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

      {/* Resume Editor Modal for Admin */}
      <ResumeEditorModal
        data={resumeData}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveResumeData}
      />
    </div>
  );
}
