import Link from 'next/link';
import styles from '@/modules/landing/styles/landing.module.css';
import { 
  Code2, 
  Beer, 
  Smartphone, 
  Database, 
  Terminal, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';

export default function LandingPage() {
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
          <span className={styles.navBadge}>v2.0 • Next.js + PostgreSQL</span>
          <Link href="/api/auth/line/login" className={styles.lineButton} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            Login
          </Link>
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

        {/* LINE Login CTA */}
        <div className={styles.ctaGroup}>
          <a href="/api/auth/line/login" className={styles.lineButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.577.39.088.922.268 1.057.616.121.312.079.803.039 1.121-.061.493-.284 1.933-.314 2.144-.044.316.143.626.471.503.243-.092 5.679-3.486 7.747-5.962C22.695 16.49 24 13.565 24 10.304z"/>
            </svg>
            <span>เข้าสู่ระบบด้วย LINE</span>
            <ArrowRight size={18} />
          </a>
          <span className={styles.lineNote}>
            🔒 ซิงค์โปรไฟล์ LINE เข้ากับเบอร์โทรศัพท์ในระบบ ปลอดภัย รวดเร็ว
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

        {/* Interactive Dev Terminal Card */}
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
              <span className={styles.codePurple}>⚡</span> LINE OAuth Channel 2011158442 ready
            </span>
            <span className={styles.codeLine}>
              <span className={styles.codeCyan}>→</span> Modules loaded: [DrinkSplit, UserProfile, HistoryLedger]
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
