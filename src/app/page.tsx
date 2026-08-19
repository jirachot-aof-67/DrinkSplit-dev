'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/modules/landing/styles/landing.module.css';
import ResumeView from '@/modules/resume/components/ResumeView';
import { defaultResumeData, ResumeData } from '@/modules/resume/types/resume';
import { 
  Beer, 
  Smartphone, 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Lock, 
  X, 
  LogIn,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const [mode, setMode] = useState<'default' | 'resume'>('resume');
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [loginType, setLoginType] = useState<'select' | 'username'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [configRes, meRes] = await Promise.all([
          fetch('/api/admin/landing-config'),
          fetch('/api/auth/me'),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          if (data.mode) setMode(data.mode);
          // Always keep latest static code schema while allowing custom edits
          setResumeData({
            ...defaultResumeData,
            ...(data.resumeData || {}),
            skills: defaultResumeData.skills,
            expertise: defaultResumeData.expertise,
          });
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          setIsAuthenticated(meData.authenticated || false);
          setIsAdmin(meData.isAdmin || false);
          setCurrentUser(meData.user || null);
        }
      } catch (err) {
        console.error('Failed to load init landing config:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchInit();
  }, []);

  const handleSwitchMode = async (newMode: 'default' | 'resume') => {
    setMode(newMode);
    try {
      await fetch('/api/admin/landing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (err) {
      console.error(err);
    }
  };

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

  const openModal = () => {
    setLoginType('select');
    setError('');
    setShowModal(true);
  };

  // If in Resume Mode, render ResumeView
  if (mode === 'resume') {
    return (
      <>
        <ResumeView 
          initialData={resumeData}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onSwitchToDefault={() => handleSwitchMode('default')}
          onOpenLoginModal={openModal}
          onDataChange={(newData) => setResumeData(newData)}
        />

        {/* Global Login Modal reused */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
            }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>

              {loginType === 'select' ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍻</div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>เลือกวิธีเข้าสู่ระบบ</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      เข้าใช้งานระบบ DrinkSplit & Modules
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <a 
                      href="/api/auth/line/login"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: '#06c755',
                        color: '#ffffff',
                        fontWeight: 700,
                        padding: '0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.577.39.088.922.268 1.057.616.121.312.079.803.039 1.121-.061.493-.284 1.933-.314 2.144-.044.316.143.626.471.503.243-.092 5.679-3.486 7.747-5.962C22.695 16.49 24 13.565 24 10.304z"/>
                      </svg>
                      <span>เข้าสู่ระบบด้วย LINE</span>
                    </a>

                    <button 
                      onClick={() => setLoginType('username')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        padding: '0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <User size={18} color="#a855f7" />
                      <span>Username & Password</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                      <ShieldCheck size={26} />
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Admin Login</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      กรอก Username และ Password ของระบบ
                    </p>
                  </div>

                  {error && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f87171', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Username</label>
                      <input 
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.85rem',
                        background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ Admin ➜'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLoginType('select'); setError(''); }}
                      style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      ← กลับไปเลือกวิธีอื่น
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard DrinkSplit Landing Page
  return (
    <div className={styles.container}>
      {/* Top Navbar */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} style={{ fontSize: '1.25rem' }}>
            🍻
          </div>
          <span>DRINK<span className="text-gradient">SPLIT</span></span>
        </div>
        <div className={styles.navLinks}>
          {/* Quick Switch (Admin Only) */}
          {isAdmin ? (
            <>
              <Link 
                href="/admin"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.5rem 0.9rem', 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  border: '1px solid rgba(168, 85, 247, 0.4)', 
                  color: '#c084fc', 
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={15} />
                <span>Admin Console</span>
              </Link>

              <button 
                onClick={() => handleSwitchMode('resume')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.5rem 0.9rem', 
                  background: 'rgba(0, 242, 254, 0.1)', 
                  border: '1px solid rgba(0, 242, 254, 0.3)', 
                  color: '#00f2fe', 
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} />
                <span>สลับเป็นหน้า Resume</span>
              </button>
              <button 
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.reload();
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.5rem 0.9rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  color: '#f87171', 
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="ออกจากระบบ"
              >
                <span>ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <button 
              onClick={openModal}
              className={styles.lineButton} 
              style={{ padding: '0.55rem 1.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.tagline}>
          <span className={styles.tagDot}></span>
          <span>Next-Gen Modular Utility Hub</span>
        </div>

        <h1 className={styles.headline}>
          Smart Tools for <span className="text-gradient">Developers</span> <br />
          & Party Drinkers.
        </h1>

        <p className={styles.subheadline}>
          แพลตฟอร์มศูนย์รวมโมดูลจัดการส่วนตัว ซิงค์บัญชีผ่าน LINE Login อัตโนมัติ 
          คำนวณบิลหารค่าเหล้าแฟร์ๆ พร้อมฐานข้อมูล Supabase PostgreSQL
        </p>

        {/* Big CTA */}
        <div className={styles.ctaGroup}>
          <button onClick={openModal} className={styles.lineButton} style={{ padding: '0.9rem 2.2rem' }}>
            <LogIn size={20} />
            <span>เข้าสู่ระบบ (Login)</span>
            <ArrowRight size={18} />
          </button>
          <span className={styles.lineNote}>
            🔒 เลือกล็อกอินผ่าน LINE หรือ Username / Password
          </span>
        </div>

        {/* Feature Bento Grid */}
        <div className={styles.previewGrid}>
          <div className={styles.previewCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox} style={{ color: '#10b981' }}>
                <Beer size={24} />
              </div>
              <h3 className={styles.cardTitle}>DrinkSplit Module</h3>
            </div>
            <p className={styles.cardDesc}>
              คำนวณหารค่าเหล้า ค่ามิกเซอร์ แยกคนดื่ม/คนขับ/สัดส่วนแอลกอฮอล์ รองรับ Prompt Slip & PromptPay QR
            </p>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox} style={{ color: '#00f2fe' }}>
                <Smartphone size={24} />
              </div>
              <h3 className={styles.cardTitle}>Phone Number Sync</h3>
            </div>
            <p className={styles.cardDesc}>
              ระบบผูกเบอร์โทรศัพท์กับ LINE User ID เพื่อดึงประวัติการหารและยอดค้างชำระอัตโนมัติ
            </p>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox} style={{ color: '#a855f7' }}>
                <Database size={24} />
              </div>
              <h3 className={styles.cardTitle}>Supabase PostgreSQL</h3>
            </div>
            <p className={styles.cardDesc}>
              จัดเก็บข้อมูลผู้ใช้ ประวัติบิล และโมดูลส่วนตัวในฐานข้อมูลความเร็วสูง ปลอดภัยด้วย Row Level Security
            </p>
          </div>
        </div>

        {/* Terminal Card */}
        <div className={styles.terminalBox}>
          <div className={styles.terminalHeader}>
            <span className={`${styles.termDot} ${styles.dotRed}`}></span>
            <span className={`${styles.termDot} ${styles.dotYellow}`}></span>
            <span className={`${styles.termDot} ${styles.dotGreen}`}></span>
            <span className={styles.termTitle}>drinksplit-core // terminal</span>
          </div>
          <div className={styles.terminalContent}>
            <span className={styles.codeLine}>
              <span className={styles.codeCyan}>$</span> next dev --turbo
            </span>
            <span className={styles.codeLine}>
              <span className={styles.codeGreen}>✓</span> Connected to Supabase PostgreSQL (Production)
            </span>
            <span className={styles.codeLine}>
              <span className={styles.codePurple}>⚡</span> LINE OAuth & Admin Portal ready
            </span>
          </div>
        </div>
      </main>

      {/* Unified Login Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            {loginType === 'select' ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍻</div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>เลือกวิธีเข้าสู่ระบบ</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    เข้าใช้งานระบบ DrinkSplit & Modules
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <a 
                    href="/api/auth/line/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      background: '#06c755',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.577.39.088.922.268 1.057.616.121.312.079.803.039 1.121-.061.493-.284 1.933-.314 2.144-.044.316.143.626.471.503.243-.092 5.679-3.486 7.747-5.962C22.695 16.49 24 13.565 24 10.304z"/>
                    </svg>
                    <span>เข้าสู่ระบบด้วย LINE</span>
                  </a>

                  <button 
                    onClick={() => setLoginType('username')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <User size={18} color="#a855f7" />
                    <span>Username & Password (Admin)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <ShieldCheck size={26} />
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Admin Login</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    กรอก Username และ Password ของระบบ
                  </p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f87171', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Username</label>
                    <input 
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Password</label>
                    <input 
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ Admin ➜'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginType('select'); setError(''); }}
                    style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  >
                    ← กลับไปเลือกวิธีอื่น
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
