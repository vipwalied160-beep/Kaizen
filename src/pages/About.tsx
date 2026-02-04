import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code, GraduationCap, Shield, Sparkles, Users, Globe, Zap, Lock, BarChart3, Laptop, Facebook, Instagram, MessageCircle } from "lucide-react";

const About = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleLanguage = () => {
    setLanguage(prev => prev === "ar" ? "en" : "ar");
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 relative flex flex-col text-gray-100 overflow-hidden">
      {/* Video Background Section */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-fill opacity-60"
        >
          <source src="/A.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Button 
          variant="ghost" 
          className="hover:bg-white/10"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={toggleLanguage}
          className="bg-transparent border-white/10 hover:bg-white/10 text-primary"
        >
          <Globe className="mr-2 h-4 w-4" />
          {language === "ar" ? "English" : "عربي"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center p-2 px-4 rounded-full bg-black/30 border border-white/10 mb-4">
             <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
             <span className={`font-medium text-muted-foreground ${language === "ar" ? "text-lg font-bold" : "text-sm"}`}>
               {language === "ar" ? "الجيل الجديد من التعليم الجامعي الذكي" : "Next Gen University Education"}
             </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Kaizen
            </span>
            <span className="text-primary">.</span>
          </h1>
          
          <p className={`text-muted-foreground max-w-3xl mx-auto leading-relaxed ${language === "ar" ? "text-2xl md:text-3xl font-semibold leading-loose" : "text-xl md:text-2xl"}`}>
            {language === "ar" 
              ? "نظام يجسد مبدأ التحسين المستمر، مصمم لدقة رصد الحضور والانضباط الأكاديمي."
              : "A system embodying the principle of continuous improvement, designed for precision in attendance tracking and academic discipline."}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="p-6 transition-all duration-300 group bg-black/30 border-white/10 hover:bg-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-gray-700/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className={`font-bold mb-2 ${language === "ar" ? "text-2xl" : "text-xl"}`}>
              {language === "ar" ? "حماية فائقة ضد التلاعب" : "Anti-Fraud Security"}
            </h3>
            <p className={`text-muted-foreground leading-relaxed ${language === "ar" ? "text-lg font-medium" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar"
                ? "خوارزميات متقدمة للتحقق من النطاق الجغرافي (Geofencing) وبصمة الجهاز، لضمان استحالة تزوير الحضور."
                : "Smart algorithms for Geofencing and Device Fingerprinting to prevent buddy punching and attendance fraud."}
            </p>
          </Card>

          <Card className="p-6 transition-all duration-300 group bg-black/30 border-white/10 hover:bg-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className={`font-bold mb-2 ${language === "ar" ? "text-2xl" : "text-xl"}`}>
              {language === "ar" ? "سرعة وكفاءة استثنائية" : "Speed & Efficiency"}
            </h3>
            <p className={`text-muted-foreground leading-relaxed ${language === "ar" ? "text-lg font-medium" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar"
                ? "تسجيل آلاف الطلاب في لحظات دون الحاجة للأوراق، مع مزامنة فورية ودقيقة للبيانات."
                : "Register thousands of students in seconds without paper or queues, with instant real-time data updates."}
            </p>
          </Card>

          <Card className="p-6 transition-all duration-300 group bg-black/30 border-white/10 hover:bg-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Laptop className="h-6 w-6 text-green-400" />
            </div>
            <h3 className={`font-bold mb-2 ${language === "ar" ? "text-2xl" : "text-xl"}`}>
              {language === "ar" ? "نظام تعليم هجين متكامل" : "Hybrid Learning"}
            </h3>
            <p className={`text-muted-foreground leading-relaxed ${language === "ar" ? "text-lg font-medium" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar"
                ? "دعم شامل للمحاضرات التفاعلية عن بُعد، وإدارة مركزية للدرجات والتقارير في منصة موحدة."
                : "Full support for online video lectures, grade management, and reporting in a single unified platform."}
            </p>
          </Card>

          <Card className="p-6 transition-all duration-300 group bg-black/30 border-white/10 hover:bg-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className={`font-bold mb-2 ${language === "ar" ? "text-2xl" : "text-xl"}`}>
              {language === "ar" ? "تحليلات بيانات متقدمة" : "Smart Analytics"}
            </h3>
            <p className={`text-muted-foreground leading-relaxed ${language === "ar" ? "text-lg font-medium" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar"
                ? "لوحات تحكم تفاعلية تمكن أعضاء هيئة التدريس والإدارة من متابعة مؤشرات الأداء ونسب الحضور بدقة."
                : "Interactive dashboards for professors and admin to monitor attendance rates and academic performance."}
            </p>
          </Card>
        </div>

        {/* Developer Info */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20" />
          <Card className="relative p-8 text-center overflow-hidden shadow-2xl border-white/10 bg-black/30">
            <div className="relative z-10">
              <Code className="h-12 w-12 mx-auto mb-6" />
              <h2 className={`font-bold mb-2 ${language === "ar" ? "text-4xl" : "text-3xl"}`}>
                {language === "ar" ? "تطوير وابتكار" : "Development Team"}
              </h2>
              <p className={`text-muted-foreground mb-8 max-w-xl mx-auto ${language === "ar" ? "text-xl font-medium" : ""}`}>
                {language === "ar" 
                  ? "تم هندسة وتطوير النظام باستخدام أحدث تقنيات الويب العالمية، لضمان أداء فائق وتجربة مستخدم سلسة." 
                  : "Designed and developed using cutting-edge web technologies to ensure high performance and seamless user experience."}
              </p>
              
              <div className="inline-flex flex-col items-center p-10 min-w-[350px] rounded-3xl bg-black/30 border border-white/10 hover:bg-white/10 transition-colors cursor-default shadow-2xl">
                <div className="h-40 w-40 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-6 shadow-xl shadow-primary/20 overflow-hidden border-4 border-[#28394B]">
                  {/* ضع رابط صورتك هنا في src */}
                  <img src="/walied.jpeg" alt="Walied Hamdy" className="w-full h-full object-cover object-top scale-125 translate-y-4 hover:scale-140 transition-transform duration-500" />
                </div>
                <h3 className="text-2xl font-bold mb-1">ENG: Walied Hamdy</h3>
                

                {/* Social Media Links */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-white/10 w-full justify-center">
                  <a 
                    href="https://wa.me/+201050954482" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-transparent border border-white/10 hover:bg-[#25D366]/20 hover:text-[#25D366] transition-all hover:scale-110"
                    title="WhatsApp"
                  >
                    <MessageCircle size={24} />
                  </a>
                  <a 
                    href="https://www.facebook.com/share/18NdYpHLoR/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-transparent border border-white/10 hover:bg-gray-700/20 hover:text-gray-700 transition-all hover:scale-110"
                    title="Facebook"
                  >
                    <Facebook size={24} />
                  </a>
                  <a 
                    href="https://www.instagram.com/____lido____?igsh=cDE3eDFqbWN0aHRp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-transparent border border-white/10 hover:bg-[#E4405F]/20 hover:text-[#E4405F] transition-all hover:scale-110"
                    title="Instagram"
                  >
                    <Instagram size={24} />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 px-4 text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Kaizen. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default About;