'use client';

import { useState, useRef } from 'react';
import { ResumeData } from '../types/resume';
import styles from '../styles/resume.module.css';
import { X, Save, Plus, Trash2, Upload, Image as ImageIcon, Briefcase, User, Mail, Sparkles, FolderPlus } from 'lucide-react';

interface ResumeEditorModalProps {
  data: ResumeData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: ResumeData) => Promise<void>;
}

export default function ResumeEditorModal({
  data,
  isOpen,
  onClose,
  onSave,
}: ResumeEditorModalProps) {
  const [formData, setFormData] = useState<ResumeData>(data);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'skills' | 'experiences'>('info');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File Upload to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert('ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกภาพไม่เกิน 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateSkill = (index: number, val: string) => {
    const updated = [...formData.skills];
    updated[index] = val;
    setFormData({ ...formData, skills: updated });
  };

  const addSkill = () => {
    setFormData({ ...formData, skills: [...formData.skills, ''] });
  };

  const removeSkill = (index: number) => {
    setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) });
  };

  const updateExpertise = (index: number, val: string) => {
    const updated = [...formData.expertise];
    updated[index] = val;
    setFormData({ ...formData, expertise: updated });
  };

  const addExpertise = () => {
    setFormData({ ...formData, expertise: [...formData.expertise, ''] });
  };

  const removeExpertise = (index: number) => {
    setFormData({ ...formData, expertise: formData.expertise.filter((_, i) => i !== index) });
  };

  // Add / Remove Work Experience
  const handleAddExperience = () => {
    const newExp = {
      role: 'New Role / ตำแหน่งใหม่',
      period: 'ปี - ปัจจุบัน',
      company: 'ชื่อบริษัท / องค์กร',
      description: ['รายละเอียดผลงานหรือหน้าที่รับผิดชอบ'],
      images: [],
    };
    setFormData({
      ...formData,
      experiences: [newExp, ...formData.experiences],
    });
  };

  const handleRemoveExperience = (index: number) => {
    if (confirm('คุณต้องการลบประวัติงานนี้หรือไม่?')) {
      setFormData({
        ...formData,
        experiences: formData.experiences.filter((_, i) => i !== index),
      });
    }
  };

  const handleAddExpImage = (expIndex: number, base64: string) => {
    const updated = [...formData.experiences];
    const currentImgs = updated[expIndex].images || [];
    updated[expIndex].images = [...currentImgs, base64];
    setFormData({ ...formData, experiences: updated });
  };

  const handleRemoveExpImage = (expIndex: number, imgIndex: number) => {
    const updated = [...formData.experiences];
    const currentImgs = updated[expIndex].images || [];
    updated[expIndex].images = currentImgs.filter((_, i) => i !== imgIndex);
    setFormData({ ...formData, experiences: updated });
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>⚙️ จัดการข้อมูล Profile / Resume</h2>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>แก้ไขรูปภาพ ข้อมูลแนะนำตัว ทักษะ และประวัติงาน</p>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {(['info', 'contact', 'skills', 'experiences'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: activeTab === tab ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: activeTab === tab ? '#00f2fe' : '#9ca3af',
                border: activeTab === tab ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab === 'info' && '👤 ข้อมูลทั่วไป & รูปภาพ'}
              {tab === 'contact' && '📞 การติดต่อ'}
              {tab === 'skills' && '⚡ ทักษะ & ความเชี่ยวชาญ'}
              {tab === 'experiences' && '💼 ประวัติการทำงาน'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'info' && (
            <div>
              {/* Photo Upload & Preview */}
              <div className={styles.inputGroup} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ fontSize: '0.9rem', color: '#00f2fe', fontWeight: 700, marginBottom: '0.8rem' }}>
                  รูปภาพโปรไฟล์ (Profile Avatar)
                </label>
                
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: '3px solid #00f2fe', flexShrink: 0 }}>
                    <img 
                      src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'} 
                      alt="avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="file" 
                        ref={avatarInputRef}
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileChange(e, (base64) => setFormData({ ...formData, avatarUrl: base64 }))}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.6rem 1rem',
                          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                          color: '#000',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Upload size={16} />
                        <span>เลือกรูปจากเครื่อง (Browse)</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      หรือวาง URL รูปภาพ:
                    </div>
                    <input
                      type="text"
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className={styles.inputField}
                      placeholder="https://example.com/avatar.jpg"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid2} style={{ marginTop: '1.2rem' }}>
                <div className={styles.inputGroup}>
                  <label>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={styles.inputField}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>ตำแหน่งงาน / หัวข้อ</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>ข้อความแนะนำตัว / สรุปประวัติย่อ (Bio)</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={styles.inputField}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })}
                    className={styles.inputField}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>อีเมล</label>
                  <input
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value }
                    })}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>LINE ID</label>
                  <input
                    type="text"
                    value={formData.contact.lineId}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, lineId: e.target.value }
                    })}
                    className={styles.inputField}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>ที่อยู่</label>
                  <input
                    type="text"
                    value={formData.contact.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, address: e.target.value }
                    })}
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00f2fe' }}>ความเชี่ยวชาญ (Expertise)</label>
                  <button type="button" onClick={addExpertise} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Plus size={14} /> เพิ่มหัวข้อ
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.expertise.map((exp, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={exp}
                        onChange={(e) => updateExpertise(idx, e.target.value)}
                        className={styles.inputField}
                        style={{ padding: '0.5rem 0.8rem' }}
                        placeholder="เช่น Full Stack Developer"
                      />
                      <button type="button" onClick={() => removeExpertise(idx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', padding: '0.4rem', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a855f7' }}>ทักษะทางเทคนิค (Skills Summary)</label>
                  <button type="button" onClick={addSkill} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Plus size={14} /> เพิ่มทักษะ
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {formData.skills.map((skill, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkill(idx, e.target.value)}
                        className={styles.inputField}
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                        placeholder="เช่น Python, Next.js"
                      />
                      <button type="button" onClick={() => removeSkill(idx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experiences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', color: '#00f2fe', fontWeight: 700 }}>💼 รายการประวัติการทำงาน ({formData.experiences.length})</h3>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    color: '#00f2fe',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <FolderPlus size={16} />
                  <span>+ เพิ่มประวัติการทำงานใหม่</span>
                </button>
              </div>

              {formData.experiences.map((exp, eIdx) => (
                <div key={eIdx} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      ประวัติที่ #{eIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(eIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>ลบประวัตินี้</span>
                    </button>
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.inputGroup}>
                      <label>ตำแหน่งงาน</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[eIdx].role = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        className={styles.inputField}
                        placeholder="เช่น Software Developer"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>ช่วงเวลา</label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[eIdx].period = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        className={styles.inputField}
                        placeholder="เช่น ตุลาคม 2567 - ปัจจุบัน"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>องค์กร / บริษัท</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...formData.experiences];
                        updated[eIdx].company = e.target.value;
                        setFormData({ ...formData, experiences: updated });
                      }}
                      className={styles.inputField}
                      placeholder="เช่น ชื่อบริษัท หรือสังกัด"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>รายละเอียดงาน (แยกบรรทัดละ 1 ข้อ)</label>
                    <textarea
                      rows={4}
                      value={exp.description.join('\n')}
                      onChange={(e) => {
                        const updated = [...formData.experiences];
                        updated[eIdx].description = e.target.value.split('\n').filter(Boolean);
                        setFormData({ ...formData, experiences: updated });
                      }}
                      className={styles.inputField}
                      placeholder="พิมพ์รายละเอียดแต่ละข้อ บรรทัดละข้อ..."
                    />
                  </div>

                  {/* Attachment Images for this Experience */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ImageIcon size={14} color="#00f2fe" />
                        รูปภาพแนบผลงาน / กิจกรรม ({exp.images?.length || 0})
                      </label>
                      
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>+ เพิ่มรูปแนบ</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => handleFileChange(e, (base64) => handleAddExpImage(eIdx, base64))}
                        />
                      </label>
                    </div>

                    {exp.images && exp.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {exp.images.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} style={{ position: 'relative', width: 70, height: 70, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img src={imgUrl} alt="attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveExpImage(eIdx, imgIdx)}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(0,0,0,0.7)',
                                color: '#f87171',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Submit */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.2rem' }}>
            <button type="button" onClick={onClose} className={styles.actionBtn} style={{ cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} style={{ cursor: 'pointer' }}>
              <Save size={16} />
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
