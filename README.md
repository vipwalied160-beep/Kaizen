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



## 🛡️ الأمان والخصوصية | Security

*   تم تفعيل نظام **Row Level Security (RLS)** في قاعدة البيانات لضمان عدم وصول أي مستخدم لبيانات الآخرين.
*   التحقق البرمجي من إحداثيات GPS لمنع تطبيقات المواقع الوهمية (Fake GPS).

---
© 2024 Kaizen System. All rights reserved.
