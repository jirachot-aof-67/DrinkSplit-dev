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
  Image as ImageIcon
} from 'lucide-react';

interface ResumeViewProps {
  initialData: ResumeData;
  isAdmin: boolean;
  onSwitchToDefault: () => void;
  onOpenLoginModal?: () => void;
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
  const router = useRouter();

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
          {/* Admin Exclusive Controls */}
          {isAdmin ? (
            <>
              <Link 
                href="/admin"
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              >
                <ShieldCheck size={16} />
                <span>Admin Panel</span>
              </Link>

              <button 
                onClick={onSwitchToDefault}
                className={styles.actionBtn}
                title="สลับกลับไปหน้า DrinkSplit ปกติ"
                style={{ cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
                <span>สลับเป็นหน้า DrinkSplit</span>
              </button>
              
              <button 
                onClick={() => setIsEditorOpen(true)}
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(0, 242, 254, 0.4)', color: '#00f2fe', cursor: 'pointer' }}
              >
                <Sliders size={16} />
                <span>แก้ไขเรซูเม่</span>
              </button>

              <button 
                onClick={handleLogout}
                className={styles.actionBtn}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', cursor: 'pointer' }}
                title="ออกจากระบบ Admin"
              >
                <LogOut size={16} />
                <span>ออกจากระบบ</span>
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
                  <span>Login</span>
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
              <span>🟢 Available for Projects & Opportunities</span>
            </div>
            <h1 className={styles.name}>{data.name}</h1>
            <div className={styles.roleTitle}>{data.title}</div>
            <p className={styles.bio}>{data.bio}</p>
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
                <h2 className={styles.cardTitle}>CONTACT</h2>
              </div>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}><Phone size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>เบอร์โทรศัพท์</label>
                    <span>{data.contact.phone}</span>
                  </div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}><Mail size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>อีเมล</label>
                    <span>{data.contact.email}</span>
                  </div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}><MapPin size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>ที่อยู่</label>
                    <span>{data.contact.address}</span>
                  </div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}><MessageCircle size={18} /></div>
                  <div className={styles.contactInfo}>
                    <label>LINE ID</label>
                    <span>{data.contact.lineId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Cpu size={20} color="#a855f7" />
                <h2 className={styles.cardTitle}>EXPERTISE</h2>
              </div>
              <div className={styles.expertiseList}>
                {data.expertise.map((item, idx) => (
                  <div key={idx} className={styles.expertiseItem}>
                    <span className={styles.expertiseDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Summary */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Code2 size={20} color="#10b981" />
                <h2 className={styles.cardTitle}>SKILLS SUMMARY</h2>
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
                <h2 className={styles.cardTitle}>WORK EXPERIENCE</h2>
              </div>

              <div className={styles.timeline}>
                {data.experiences.map((exp, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div className={styles.expHeader}>
                      <div className={styles.expRole}>{exp.role}</div>
                      <span className={styles.expPeriod}>{exp.period}</span>
                      <div className={styles.expCompany}>{exp.company}</div>
                    </div>
                    <ul className={styles.expList}>
                      {exp.description.map((desc, dIdx) => (
                        <li key={dIdx}>{desc}</li>
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
                <h2 className={styles.cardTitle}>EDUCATION</h2>
              </div>

              <div>
                {data.education.map((edu, idx) => (
                  <div key={idx} className={styles.eduItem}>
                    <div className={styles.eduInstitution}>{edu.institution}</div>
                    <div className={styles.eduPeriod}>{edu.period}</div>
                    <div className={styles.eduDegree}>{edu.degree}</div>
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
