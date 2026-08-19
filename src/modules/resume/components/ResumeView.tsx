'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResumeData } from '../types/resume';
import styles from '../styles/resume.module.css';
import ResumeEditorModal from './ResumeEditorModal';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Code2, 
  LogIn, 
  LogOut,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Languages,
  ExternalLink
} from 'lucide-react';

interface ResumeViewProps {
  initialData: ResumeData;
  isAdmin: boolean;
  onSwitchToDefault: () => void;
  onOpenLoginModal?: () => void;
}

// Translations mapping
const translations = {
  th: {
    statusBadge: '🟢 พร้อมรับงาน & โอกาสใหม่ๆ',
    contact: 'CONTACT / ติดต่อ',
    phoneLabel: 'เบอร์โทรศัพท์',
    emailLabel: 'อีเมล',
    addressLabel: 'ที่อยู่',
    lineLabel: 'LINE ID (คลิกเพื่อแอด)',
    expertise: 'EXPERTISE / ความเชี่ยวชาญ',
    skills: 'SKILLS SUMMARY / ทักษะทางเทคนิค',
    experience: 'WORK EXPERIENCE / ประวัติการทำงาน',
    education: 'EDUCATION / การศึกษา',
    adminPanel: 'Admin Panel',
    switchToDrinkSplit: 'สลับเป็นหน้า DrinkSplit',
    editResume: 'แก้ไขเรซูเม่',
    logout: 'ออกจากระบบ',
    login: 'Login',
  },
  en: {
    statusBadge: '🟢 Available for Projects & Opportunities',
    contact: 'CONTACT',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email Address',
    addressLabel: 'Location',
    lineLabel: 'LINE ID (Click to Add)',
    expertise: 'EXPERTISE',
    skills: 'SKILLS SUMMARY',
    experience: 'WORK EXPERIENCE',
    education: 'EDUCATION',
    adminPanel: 'Admin Panel',
    switchToDrinkSplit: 'Switch to DrinkSplit',
    editResume: 'Edit Resume',
    logout: 'Logout',
    login: 'Login',
  }
};

// Automatic English translation dictionary for default resume contents
const englishContentMap: Record<string, string> = {
  // Bio
  'นักพัฒนาซอฟต์แวร์และผู้ดูแลระบบโครงสร้างพื้นฐานไอที มุ่งเน้นการสร้างสรรค์โซลูชันระบบอัตโนมัติ การบริหารจัดการฐานข้อมูล และพัฒนาระบบ Intranet/Web Applications เพื่อเพิ่มประสิทธิภาพองค์กร':
    'Software Developer & IT Infrastructure Specialist passionate about building automation systems, database administration, and developing high-performance Intranet/Web Applications to maximize organizational productivity.',

  // Address
  '118 ม.6 ต.มะขุนหวาน อ.สันป่าตอง จ.เชียงใหม่':
    '118 M.6, Makhunwan, San Pa Tong, Chiang Mai 50120, Thailand',

  // Periods
  'ตุลาคม 2567 - ปัจจุบัน': 'Oct 2024 - Present',
  'มิถุนายน 2567 - กันยายน 2567': 'Jun 2024 - Sep 2024',
  'กันยายน 2564 - มิถุนายน 2567': 'Sep 2021 - Jun 2024',
  'พ.ศ. 2559 - 2563': '2016 - 2020',
  'มัธยมศึกษาตอนปลาย พ.ศ. 2557 - 2559 | มัธยมศึกษาตอนต้น พ.ศ. 2554 - 2556': 'High School (2014 - 2016) | Middle School (2011 - 2013)',

  // Companies
  'Hylife Global Food - พัฒนาโปรแกรมด้วยภาษา Python': 'Hylife Global Food - Python Software Development',
  'โรงพยาบาลลำพูนใกล้หมอ': 'Lamphun Klai Mor Hospital',
  'สหกรณ์การเกษตรสันป่าตอง จำกัด': 'Sanpatong Agricultural Cooperative Ltd.',

  // Institutions
  'มหาวิทยาลัยราชภัฏเชียงใหม่': 'Chiang Mai Rajabhat University',
  'โรงเรียน เมธีวุฒิกรฯ ลำพูน': 'Metheewutthi Korn School, Lamphun',
  'มัธยมศึกษา': 'Secondary Education Diploma',

  // Work bullet points
  'Python Development: พัฒนาโปรแกรมด้วย Python และจัดการ Source Code ผ่าน Git/Sourcetree (GitHub, Bitbucket) Docker หรือ พัฒนาโปรแกรมให้สอดคล้องกับความต้องการของผู้ใช้หรือแผนกต่างๆ':
    'Python Development: Built internal applications using Python, managed source code via Git/Sourcetree (GitHub, Bitbucket) and Docker, tailoring software to departmental user requirements.',
  'QMS Request System: สร้างระบบอนุมัติและแก้ไขเอกสารมาตรฐานคุณภาพ (Approve/Revised) ตามลำดับสายงาน':
    'QMS Request System: Developed Quality Management System approval and document revision workflow following multi-level approval hierarchies.',
  'Warehouse & Production Support: ระบบส่งบิลและติดตามสถานะการผลิต-จัดส่งสินค้าแบบ Real-time':
    'Warehouse & Production Support: Implemented real-time production tracking, dispatch management, and automated invoicing pipeline.',
  'SO Tracking System: ระบบติดตามสถานะใบสั่งขาย (Sales Order) และระยะเวลาการดำเนินงานของแต่ละแผนก':
    'SO Tracking System: Built Sales Order tracking dashboard to monitor progress and operational lead times across departments.',
  'IT Management System: ระบบแจ้งซ่อม, จัดเก็บ Inventory, และเบิก-ถอน-ยืม อุปกรณ์ไอที (IT Borrow)':
    'IT Management System: Developed IT helpdesk ticket system, inventory management, and IT hardware borrowing/requisition portal.',
  'Car Booking: ระบบจองรถออนไลน์เพื่อบริหารจัดการคิวรถและติดตามสถานะการใช้งานอย่างเป็นระบบ':
    'Car Booking System: Created online fleet vehicle booking and dispatch schedule tracking system.',
  'Car Tracking: ระบบติดตามการใช้งานรถรับ-ส่งพนักงานและลูกค้า':
    'Car Tracking: Built vehicle utilization monitoring for employee transit and customer transportation.',
  'Warehouse Management System: ระบบบริหารจัดการคลังสินค้าแบบครบวงจรของบริษัท':
    'Warehouse Management System: Developed comprehensive end-to-end warehouse and storage logistics operations portal.',
  'Intranet Portal: พัฒนาเว็บรวมข้อมูลภายในองค์กร โดยประยุกต์ใช้ AI และ Google AppSheet':
    'Intranet Portal: Engineered unified company intranet portal integrating AI capabilities and Google AppSheet automation.',
  'IT Support Infra: ติดตั้งและดูแลระบบ CCTV ทั่วทั้งองค์กร, วางระบบและดูแลโครงสร้างพื้นฐาน Network ทั้งหมดขององค์กร, Server & Database ติดตั้งและบริหารจัดการ Server Database ผ่าน Domain/Sub-domain เพื่อรองรับระบบ Intranet':
    'IT Infrastructure: Deployed enterprise-wide CCTV networks, engineered robust network infrastructure, and maintained internal servers/databases across domain subdomains.',

  'เจ้าหน้าที่ IT Support ดูแลระบบเครือข่าย ทำเว็บ intranet ภายในองค์กร':
    'IT Support Specialist managing network infrastructure and developing corporate intranet web services.',
  'เช็คกล้อง CCTV ดูแลตรวจสอบระบบคอมพิวเตอร์ เครื่องปริ้น ภายในองค์กร':
    'Monitored and maintained enterprise CCTV systems, workstation hardware, printers, and peripheral devices.',
  'เซ็ตระบบหน้างาน ประชุม zoom หรือ meeting ต่างๆ':
    'Configured audio/visual hardware, Zoom conferencing setups, and technical event equipment.',

  'เจ้าหน้าที่ IT Support ดูแลระบบคอมพิวเตอร์ เครื่องปรับระบบหน้างาน':
    'IT Support Officer maintaining workstations, network peripherals, and operational IT equipment.',
  'ตัดต่อ VIDEO ถ่ายภาพแต่งภาพ เซ็ตระบบหน้างาน ประชุมต่างๆ ประชุมออนไลน์':
    'Video editing, multimedia photography, photo retouches, and online conference live streaming operations.',
  'ดูแลระบบเครือข่าย เขียนโปรแกรมซัพพอร์ตหน้างาน':
    'Managed local network systems and wrote specialized software tools supporting operational field workflows.',
};

// Translate text helper: check explicit EN custom text first, then auto dictionary, then original text
function tr(text: string, isEn: boolean, customEnText?: string): string {
  if (!isEn || !text) return text;
  if (customEnText && customEnText.trim() !== '') return customEnText;
  return englishContentMap[text] || text;
}

export default function ResumeView({ 
  initialData, 
  isAdmin,
  onSwitchToDefault,
  onOpenLoginModal 
}: ResumeViewProps) {
  const [data, setData] = useState<ResumeData>(initialData);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const isEn = lang === 'en';
  const t = translations[lang];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleSaveData = async (newData: ResumeData) => {
    setData(newData);
    try {
      await fetch('/api/admin/landing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: newData }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Safe links generator
  const cleanPhone = data.contact.phone.replace(/[^0-9+]/g, '');
  const telLink = `tel:${cleanPhone}`;
  const mailLink = `mailto:${data.contact.email}?subject=Contact%20from%20Portfolio`;
  const cleanLine = data.contact.lineId.replace(/^@/, '');
  const lineLink = `https://line.me/ti/p/~${cleanLine}`;
  const mapLink = data.contact.mapUrl && data.contact.mapUrl.trim() !== ''
    ? data.contact.mapUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.contact.address)}`;

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div style={{ fontSize: '1.4rem' }}>⚡</div>
          <span>PORTFOLIO<span className="text-gradient">.DEV</span></span>
          <span className={styles.brandBadge}>{data.name}</span>
        </div>

        <div className={styles.navActions}>
          {/* 🌐 Language Switcher TH / EN */}
          <button
            onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
            className={styles.actionBtn}
            style={{
              borderColor: 'rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              fontWeight: 700,
              background: 'rgba(0, 242, 254, 0.1)',
              cursor: 'pointer'
            }}
            title="เปลี่ยนภาษา / Switch Language"
          >
            <Languages size={15} />
            <span>{lang === 'th' ? '🇹🇭 TH | EN' : '🇬🇧 EN | TH'}</span>
          </button>

          {/* Admin Exclusive Controls */}
          {isAdmin ? (
            <>
              <Link 
                href="/admin"
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              >
                <ShieldCheck size={16} />
                <span>{t.adminPanel}</span>
              </Link>

              <button 
                onClick={onSwitchToDefault}
                className={styles.actionBtn}
                title="สลับกลับไปหน้า DrinkSplit ปกติ"
                style={{ cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
                <span>{t.switchToDrinkSplit}</span>
              </button>
              
              <button 
                onClick={() => setIsEditorOpen(true)}
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(0, 242, 254, 0.4)', color: '#00f2fe', cursor: 'pointer' }}
              >
                <Sliders size={16} />
                <span>{t.editResume}</span>
              </button>

              <button 
                onClick={handleLogout}
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', cursor: 'pointer' }}
                title="ออกจากระบบ Admin"
              >
                <LogOut size={16} />
                <span>{t.logout}</span>
              </button>
            </>
          ) : (
            <>
              {onOpenLoginModal && (
                <button 
                  onClick={onOpenLoginModal}
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  style={{ cursor: 'pointer' }}
                >
                  <LogIn size={16} />
                  <span>{t.login}</span>
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Main Resume Container */}
      <main className={styles.resumeWrapper}>
        
        {/* Hero Card */}
        <section className={styles.heroCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarGlow} />
            <div className={styles.avatarFrame}>
              <img 
                src={data.avatarUrl} 
                alt={data.name} 
                className={styles.avatarImg} 
              />
            </div>
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.nameBadge}>
              <span>{t.statusBadge}</span>
            </div>
            <h1 className={styles.name}>{data.name}</h1>
            <div className={styles.roleTitle}>{tr(data.title, isEn, data.titleEn)}</div>
            <p className={styles.bio}>{tr(data.bio, isEn, data.bioEn)}</p>
          </div>
        </section>

        {/* 2-Column Grid Content */}
        <div className={styles.mainGrid}>
          
          {/* Left Column: Contact, Expertise, Skills */}
          <aside className={styles.sideSection}>
            {/* Contact */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Phone size={20} color="#00f2fe" />
                <h2 className={styles.cardTitle}>{t.contact}</h2>
              </div>
              <div className={styles.contactList}>
                {/* 1. Phone Link */}
                <a href={telLink} className={styles.contactItem} title="โทรออก">
                  <div className={styles.contactIcon}><Phone size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>{t.phoneLabel}</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {data.contact.phone}
                      <ExternalLink size={12} color="#00f2fe" />
                    </span>
                  </div>
                </a>

                {/* 2. Email Link */}
                <a href={mailLink} className={styles.contactItem} title="ส่งอีเมล">
                  <div className={styles.contactIcon}><Mail size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>{t.emailLabel}</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {data.contact.email}
                      <ExternalLink size={12} color="#00f2fe" />
                    </span>
                  </div>
                </a>

                {/* 3. Address Google Maps Link */}
                <a href={mapLink} target="_blank" rel="noopener noreferrer" className={styles.contactItem} title="เปิดใน Google Maps">
                  <div className={styles.contactIcon}><MapPin size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>{t.addressLabel}</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {tr(data.contact.address, isEn, data.contact.addressEn)}
                      <ExternalLink size={12} color="#00f2fe" />
                    </span>
                  </div>
                </a>

                {/* 4. LINE App / Profile Link */}
                <a href={lineLink} target="_blank" rel="noopener noreferrer" className={styles.contactItem} title="แอดไลน์ (LINE)">
                  <div className={styles.contactIcon} style={{ background: 'rgba(6, 199, 85, 0.15)', color: '#06c755', borderColor: 'rgba(6, 199, 85, 0.3)' }}>
                    <MessageCircle size={18} />
                  </div>
                  <div className={styles.contactInfo}>
                    <label>{t.lineLabel}</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#06c755' }}>
                      {data.contact.lineId}
                      <ExternalLink size={12} color="#06c755" />
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Expertise */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Cpu size={20} color="#a855f7" />
                <h2 className={styles.cardTitle}>{t.expertise}</h2>
              </div>
              <div className={styles.expertiseList}>
                {data.expertise.map((item, idx) => (
                  <div key={idx} className={styles.expertiseItem}>
                    <span className={styles.expertiseDot} />
                    <span>{tr(item, isEn)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Summary */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Code2 size={20} color="#10b981" />
                <h2 className={styles.cardTitle}>{t.skills}</h2>
              </div>
              <div className={styles.skillsGrid}>
                {data.skills.map((skill, idx) => (
                  <span key={idx} className={styles.skillPill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Work Experience & Education */}
          <section className={styles.contentSection}>
            
            {/* Work Experience */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Briefcase size={22} color="#00f2fe" />
                <h2 className={styles.cardTitle}>{t.experience}</h2>
              </div>

              <div className={styles.timeline}>
                {data.experiences.map((exp, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div className={styles.expHeader}>
                      <div className={styles.expRole}>{tr(exp.role, isEn, exp.roleEn)}</div>
                      <span className={styles.expPeriod}>{tr(exp.period, isEn, exp.periodEn)}</span>
                      <div className={styles.expCompany}>{tr(exp.company, isEn, exp.companyEn)}</div>
                    </div>
                    <ul className={styles.expList}>
                      {exp.description.map((desc, dIdx) => (
                        <li key={dIdx}>{tr(desc, isEn, exp.descriptionEn?.[dIdx])}</li>
                      ))}
                    </ul>

                    {/* Attached Images */}
                    {exp.images && exp.images.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {exp.images.map((img, imgIdx) => (
                          <div 
                            key={imgIdx} 
                            onClick={() => setSelectedPreviewImage(img)}
                            style={{ 
                              width: 80, 
                              height: 80, 
                              borderRadius: '8px', 
                              overflow: 'hidden', 
                              border: '1px solid rgba(0, 242, 254, 0.3)', 
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}
                          >
                            <img src={img} alt="work sample" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <GraduationCap size={22} color="#f59e0b" />
                <h2 className={styles.cardTitle}>{t.education}</h2>
              </div>

              <div>
                {data.education.map((edu, idx) => (
                  <div key={idx} className={styles.eduItem}>
                    <div className={styles.eduInstitution}>{tr(edu.institution, isEn, edu.institutionEn)}</div>
                    <div className={styles.eduPeriod}>{tr(edu.period, isEn, edu.periodEn)}</div>
                    <div className={styles.eduDegree}>{tr(edu.degree, isEn, edu.degreeEn)}</div>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </div>
      </main>

      {/* Lightbox Image Preview Modal */}
      {selectedPreviewImage && (
        <div 
          onClick={() => setSelectedPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={selectedPreviewImage} 
            alt="Enlarged preview" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 0 30px rgba(0, 242, 254, 0.5)' }} 
          />
        </div>
      )}

      {/* Resume Editor Modal (Only for Admin) */}
      {isAdmin && (
        <ResumeEditorModal 
          data={data}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveData}
        />
      )}
    </div>
  );
}
