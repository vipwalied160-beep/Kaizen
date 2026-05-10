# 🚀 Kaizen | كايزن - Intelligent Academic Management System

**كايزن (Kaizen)** هو منصة تعليمية متكاملة تهدف إلى تحقيق "التحسين المستمر" في الإدارة الجامعية. يركز النظام على الدقة والأمان في رصد الحضور باستخدام تقنيات الموقع الجغرافي (Geofencing) ومنع التلاعب، بالإضافة إلى إدارة شاملة للدرجات والمحاضرات الافتراضية.

---

## ✨ المميزات الرئيسية | Key Features

### 📍 نظام الحضور الذكي (Smart Attendance)
*   **التحقق الجغرافي (Geofencing):** نظام دقيق يمنع تسجيل الحضور إلا إذا كان الطالب داخل النطاق المكاني للقاعة الدراسية.
*   **منع التلاعب (Anti-Fraud):** استخدام تقنية بصمة الجهاز (Device Fingerprinting) لضمان عدم تسجيل أكثر من طالب من نفس الهاتف.
*   **تحديثات لحظية:** متابعة حية لعدد الطلاب المسجلين للأستاذ مع إمكانية تصدير البيانات فوراً.

### 📊 إدارة الدرجات والتقارير (Grades & Reporting)
*   لوحة تحكم متكاملة للأستاذ لإدخال وتعديل الدرجات.
*   **تصدير البيانات:** دعم كامل لتصدير التقارير بصيغة **Excel (CSV)** لسهولة الأرشفة.
*   **التحكم الإداري:** صلاحيات مخصصة لكل أستاذ يتم التحكم بها من خلال لوحة الإدارة.

### 🎥 المحاضرات الافتراضية (Live Meetings)
*   دمج تقنية **Jitsi Meet** لعمل اجتماعات فيديو مباشرة داخل المنصة.
*   تحكم كامل للأستاذ في تفعيل أو إيقاف روابط المحاضرات.

### 🛡️ لوحة تحكم المدير (Admin Dashboard)
*   توليد أكواد فريدة للأساتذة (Unique Professor Codes).
*   إدارة الحسابات والصلاحيات (Permissions Management) لكل أستاذ بشكل منفصل.

---

## 🛠️ التقنيات المستخدمة | Tech Stack

*   **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Realtime)
*   **State Management:** [TanStack Query](https://tanstack.com/query/latest)
*   **Video Meetings:** Jitsi Meet API

---

## 🚀 البدء في العمل | Getting Started

### المتطلبات الأساسية (Prerequisites)
*   Node.js (نسخة 18 أو أحدث)
*   حساب على Supabase

### التثبيت (Installation)

1. **استنساخ المشروع:**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd arcane-attendance
   ```

2. **تثبيت المكتبات:**
   ```bash
   npm install
   ```

3. **إعداد المتغيرات البيئية:**
   قم بإنشاء ملف `.env` في المجلد الرئيسي وأضف المفاتيح التالية:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_PASSWORD=your_secure_admin_password
   ```

4. **تشغيل المشروع:**
   ```bash
   npm run dev
   ```

---

## 🛡️ الأمان والخصوصية | Security

*   تم تفعيل نظام **Row Level Security (RLS)** في قاعدة البيانات لضمان عدم وصول أي مستخدم لبيانات الآخرين.
*   التحقق البرمجي من إحداثيات GPS لمنع تطبيقات المواقع الوهمية (Fake GPS).

---

## 👨‍💻 تطوير | Developed By

**Eng. Walied Hamdy**
*   Facebook
*   Instagram
*   WhatsApp

---
© 2024 Kaizen System. All rights reserved.
