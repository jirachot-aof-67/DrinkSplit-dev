export interface ResumeData {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    lineId: string;
  };
  expertise: string[];
  skills: string[];
  experiences: {
    role: string;
    period: string;
    company: string;
    description: string[];
    images?: string[];
  }[];
  education: {
    institution: string;
    period: string;
    degree: string;
  }[];
}

export interface LandingConfig {
  mode: 'default' | 'resume';
  resumeData: ResumeData;
}

export const defaultResumeData: ResumeData = {
  name: 'JIRACHOT YAAAUN',
  title: 'Software Developer / IT Support Infra',
  bio: 'นักพัฒนาซอฟต์แวร์และผู้ดูแลระบบโครงสร้างพื้นฐานไอที มุ่งเน้นการสร้างสรรค์โซลูชันระบบอัตโนมัติ การบริหารจัดการฐานข้อมูล และพัฒนาระบบ Intranet/Web Applications เพื่อเพิ่มประสิทธิภาพองค์กร',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  contact: {
    phone: '098-4577638',
    email: 'jirachotaof@gmail.com',
    address: '118 ม.6 ต.มะขุนหวาน อ.สันป่าตอง จ.เชียงใหม่',
    lineId: 'jirachotaof',
  },
  expertise: [
    'Full Stack Developer',
    'Python programmer',
    'PHP programmer',
    'IT Support & Network Infra',
    'Video editor & Media',
    'E-Commerce Marketing',
  ],
  skills: [
    'Python',
    'Sourcetree',
    'Git / GitHub',
    'PHP',
    'SQL Server',
    'JavaScript / TypeScript',
    'HTML5 / CSS3',
    'VS Code',
    'Microsoft Office',
    'Adobe Photoshop',
    'Adobe Premiere Pro',
    'Adobe Illustrator',
  ],
  experiences: [
    {
      role: 'Software Developer / IT Support Infra',
      period: 'ตุลาคม 2567 - ปัจจุบัน',
      company: 'Hylife Global Food - พัฒนาโปรแกรมด้วยภาษา Python',
      description: [
        'Python Development: พัฒนาโปรแกรมด้วย Python และจัดการ Source Code ผ่าน Git/Sourcetree (GitHub, Bitbucket) Docker หรือ พัฒนาโปรแกรมให้สอดคล้องกับความต้องการของผู้ใช้หรือแผนกต่างๆ',
        'QMS Request System: สร้างระบบอนุมัติและแก้ไขเอกสารมาตรฐานคุณภาพ (Approve/Revised) ตามลำดับสายงาน',
        'Warehouse & Production Support: ระบบส่งบิลและติดตามสถานะการผลิต-จัดส่งสินค้าแบบ Real-time',
        'SO Tracking System: ระบบติดตามสถานะใบสั่งขาย (Sales Order) และระยะเวลาการดำเนินงานของแต่ละแผนก',
        'IT Management System: ระบบแจ้งซ่อม, จัดเก็บ Inventory, และเบิก-ถอน-ยืม อุปกรณ์ไอที (IT Borrow)',
        'Car Booking: ระบบจองรถออนไลน์เพื่อบริหารจัดการคิวรถและติดตามสถานะการใช้งานอย่างเป็นระบบ',
        'Car Tracking: ระบบติดตามการใช้งานรถรับ-ส่งพนักงานและลูกค้า',
        'Warehouse Management System: ระบบบริหารจัดการคลังสินค้าแบบครบวงจรของบริษัท',
        'Intranet Portal: พัฒนาเว็บรวมข้อมูลภายในองค์กร โดยประยุกต์ใช้ AI และ Google AppSheet',
        'IT Support Infra: ติดตั้งและดูแลระบบ CCTV ทั่วทั้งองค์กร, วางระบบและดูแลโครงสร้างพื้นฐาน Network ทั้งหมดขององค์กร, Server & Database ติดตั้งและบริหารจัดการ Server Database ผ่าน Domain/Sub-domain เพื่อรองรับระบบ Intranet',
      ],
    },
    {
      role: 'IT Support',
      period: 'มิถุนายน 2567 - กันยายน 2567',
      company: 'โรงพยาบาลลำพูนใกล้หมอ',
      description: [
        'เจ้าหน้าที่ IT Support ดูแลระบบเครือข่าย ทำเว็บ intranet ภายในองค์กร',
        'เช็คกล้อง CCTV ดูแลตรวจสอบระบบคอมพิวเตอร์ เครื่องปริ้น ภายในองค์กร',
        'เซ็ตระบบหน้างาน ประชุม zoom หรือ meeting ต่างๆ',
      ],
    },
    {
      role: 'IT Support',
      period: 'กันยายน 2564 - มิถุนายน 2567',
      company: 'สหกรณ์การเกษตรสันป่าตอง จำกัด',
      description: [
        'เจ้าหน้าที่ IT Support ดูแลระบบคอมพิวเตอร์ เครื่องปรับระบบหน้างาน',
        'ตัดต่อ VIDEO ถ่ายภาพแต่งภาพ เซ็ตระบบหน้างาน ประชุมต่างๆ ประชุมออนไลน์',
        'ดูแลระบบเครือข่าย เขียนโปรแกรมซัพพอร์ตหน้างาน',
      ],
    },
  ],
  education: [
    {
      institution: 'มหาวิทยาลัยราชภัฏเชียงใหม่',
      period: 'พ.ศ. 2559 - 2563',
      degree: 'Business Computer',
    },
    {
      institution: 'โรงเรียน เมธีวุฒิกรฯ ลำพูน',
      period: 'มัธยมศึกษาตอนปลาย พ.ศ. 2557 - 2559 | มัธยมศึกษาตอนต้น พ.ศ. 2554 - 2556',
      degree: 'มัธยมศึกษา',
    },
  ],
};
