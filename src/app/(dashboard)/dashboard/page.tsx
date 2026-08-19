import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifySessionToken } from '@/lib/line';
import styles from '@/modules/dashboard/styles/dashboard.module.css';
import { 
  Beer, 
  Smartphone, 
  Settings, 
  LogOut, 
  PlusCircle, 
  Sparkles, 
  CreditCard,
  UserCheck,
  Home,
  ShieldCheck
} from 'lucide-react';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('user_session')?.value;
  
  let user = {
    displayName: 'Dev Guest',
    pictureUrl: '',
    phoneNumber: '08X-XXX-XXXX',
    lineUserId: 'guest_user',
  };

  if (sessionToken) {
    const verified = await verifySessionToken(sessionToken);
    if (verified) {
      user = {
        displayName: verified.displayName || 'Dev User',
        pictureUrl: verified.pictureUrl || '',
        phoneNumber: verified.phoneNumber || 'ยังไม่ได้ซิงค์',
        lineUserId: verified.lineUserId,
      };
    }
  }

  const modules = [
    {
      id: 'drink-split',
      title: 'DrinkSplit 🍻',
      desc: 'ระบบคำนวณบิลหารค่าเหล้า มิกเซอร์ แยกคนดื่ม/คนขับ PromptPay QR',
      href: '/modules/drink-split',
      active: true,
      tag: 'Ready to use',
      icon: Beer,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      id: 'history-ledger',
      title: 'Party History 📊',
      desc: 'ประวัติการหารบิลย้อนหลัง สรุปยอดค้างจ่าย บันทึกสลิปโอนเงิน',
      href: '#',
      active: false,
      tag: 'Coming Soon',
      icon: CreditCard,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 'party-rooms',
      title: 'Live Party Room 📱',
      desc: 'สร้างห้องแชร์ลิ้งค์ให้เพื่อนในวงเหล้าเข้ามากดสั่งและดูยอด Realtime',
      href: '#',
      active: false,
      tag: 'Planned',
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Dashboard Topbar */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span style={{ fontSize: '1.4rem' }}>🍻</span>
          <span>DRINK<span className="text-gradient">SPLIT</span></span>
          <span className={styles.badge}>DASHBOARD</span>
        </div>

        <div className={styles.userProfile}>
          {user.pictureUrl ? (
            <img src={user.pictureUrl} alt={user.displayName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{user.displayName[0]}</div>
          )}
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.displayName}</span>
            <span className={styles.userPhone}>📱 {user.phoneNumber}</span>
          </div>
          <Link href="/" className={styles.logoutBtn} title="ไปยังหน้าแรก (Home)">
            <Home size={18} />
          </Link>
          <Link href="/api/auth/logout" className={styles.logoutBtn} title="ออกจากระบบ">
            <LogOut size={18} />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h1>ยินดีต้อนรับ, <span className="text-gradient">{user.displayName}</span></h1>
            <p>เลือกโมดูลที่ต้องการใช้งาน หรือจัดการระบบของคุณ</p>
          </div>
          <div className={styles.statusBox}>
            <UserCheck size={18} className={styles.statusIcon} />
            <span>LINE Synced</span>
          </div>
        </div>

        {/* Modules Bento Grid */}
        <div className={styles.sectionHeader}>
          <h2>Installed Modules</h2>
          <span className={styles.moduleCount}>{modules.length} Total</span>
        </div>

        <div className={styles.moduleGrid}>
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id} 
                className={`${styles.moduleCard} ${!m.active ? styles.cardDisabled : ''}`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconWrapper} style={{ background: m.gradient }}>
                    <Icon size={24} color="#fff" />
                  </div>
                  <span className={`${styles.tag} ${m.active ? styles.tagActive : styles.tagPending}`}>
                    {m.tag}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{m.title}</h3>
                <p className={styles.cardDesc}>{m.desc}</p>

                <div className={styles.cardFooter}>
                  {m.active ? (
                    <Link href={m.href} className={styles.launchBtn}>
                      เปิดโมดูล ➜
                    </Link>
                  ) : (
                    <span className={styles.disabledText}>เร็วๆ นี้</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
