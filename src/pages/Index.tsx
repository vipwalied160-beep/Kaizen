import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GraduationCap, UserCircle2, Sparkles, Shield, Info, Rocket } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const Index = () => {
  const navigate = useNavigate();
  const [showProfessorDialog, setShowProfessorDialog] = useState(false);
  const [professorEmail, setProfessorEmail] = useState("");
  const [professorPassword, setProfessorPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Student code entry
  const [showStudentCodeDialog, setShowStudentCodeDialog] = useState(false);
  const [studentProfessorCode, setStudentProfessorCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  useEffect(() => {
    // Check if already logged in as professor
    const checkAuth = async () => {
      const isProfessorAuth = localStorage.getItem('professor_authenticated') === 'true';
      if (isProfessorAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/professor');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  // تبطيء سرعة الفيديو
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5; // سرعة 50%
    }
  }, []);

  const handleProfessorLogin = useCallback(async () => {
    if (!professorEmail || !professorPassword) {
      toast.error("الرجاء إدخال البريد الإلكتروني وكلمة السر");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: professorEmail,
        password: professorPassword,
      });

      if (error) throw error;

      // Check if user is a professor
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'professor')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("هذا الحساب ليس حساب دكتور");
        return;
      }

      localStorage.setItem('professor_authenticated', 'true');
      toast.success("✅ تم تسجيل الدخول بنجاح");
      navigate('/professor');
      setShowProfessorDialog(false);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("البريد الإلكتروني أو كلمة السر غير صحيحة");
      } else {
        toast.error(error.message || "فشل تسجيل الدخول");
      }
    } finally {
      setIsLoading(false);
    }
  }, [professorEmail, professorPassword, navigate]);

  const handleStudentEnterWithCode = useCallback(async () => {
    if (!studentProfessorCode.trim()) {
      toast.error("الرجاء إدخال كود الدكتور");
      return;
    }

    setIsVerifyingCode(true);
    try {
      // Use the RPC function which is secure and accessible
      const { data: codeData, error } = await supabase
        .rpc('get_professor_by_code', { p_code: studentProfessorCode.toUpperCase() });

      if (error) {
        console.error('RPC Error:', error);
        toast.error("حدث خطأ أثناء التحقق من الكود");
        return;
      }

      if (!codeData || codeData.length === 0) {
        toast.error("الكود غير صحيح");
        return;
      }

      const professorData = codeData[0];

      // Store the professor code for student session
      localStorage.setItem('student_professor_code', studentProfessorCode.toUpperCase());
      localStorage.setItem('student_professor_id', professorData.professor_id);
      localStorage.setItem('student_professor_name', professorData.professor_name);
      
      setShowStudentCodeDialog(false);
      toast.success(`✅ تم التحقق - الدكتور: ${professorData.professor_name}`);
      
      // Navigate to auth page for student registration
      navigate('/auth', { 
        state: { 
          professorCode: studentProfessorCode.toUpperCase(), 
          professorName: professorData.professor_name 
        } 
      });
    } catch (err) {
      console.error('Error verifying code:', err);
      toast.error("حدث خطأ أثناء التحقق من الكود");
    } finally {
      setIsVerifyingCode(false);
    }
  }, [studentProfessorCode, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      
      {/* Video Background Section */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          {/* ⬇️⬇️ ضع رابط الفيديو الخاص بك هنا في خاصية src ⬇️⬇️ */}
          <source src="/M.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center py-4 px-4 gap-2">
        <div className="w-full flex justify-end gap-2">
          <Button
            onClick={() => navigate('/about')}
            variant="outline"
            className="text-primary gap-2"
          >
            <Info size={20} />
            About
          </Button>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="text-accent gap-2"
          >
            <Shield size={20} />
            Admin
          </Button>
          {!isStarted && (
            <Button
              onClick={() => setIsStarted(true)}
              className="gap-2 pulse-glow"
            >
              <Rocket size={20} />
              Get Started
            </Button>
          )}
        </div>

        <div className="text-center mt-[-10px]">
          <h1 className="text-3xl md:text-6xl font-bold text-blue-800 drop-shadow-[0_0_10px_rgba(30,64,175,0.5)] mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-blue-800" size={40} />
            Kaizen
          </h1>
          <p className="text-lg md:text-2xl text-blue-800 font-bold">
            كايزن | التحسين المستمر
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        {isStarted && (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full animate-in slide-in-from-bottom-24 fade-in duration-1000">
          {/* Student Card */}
          <Card 
            className="card-3d p-8 space-y-6 cursor-pointer hover:scale-105 transition-transform shadow-2xl border-white/10 bg-white/5"
            onClick={() => setShowStudentCodeDialog(true)}
          >
            <div className="flex justify-center">
              <GraduationCap className="text-blue-800" size={80} />
            </div>
            <h2 className="text-3xl font-bold text-center text-blue-800">
              Student Portal
            </h2>
            <p className="text-center text-white text-lg" dir="rtl">
              بوابة الطالب
            </p>
            <Button 
              className="w-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              دخول الطلاب | Enter
            </Button>
          </Card>

          {/* Professor Card */}
          <Card 
            className="card-3d p-8 space-y-6 cursor-pointer hover:scale-105 transition-transform shadow-2xl border-white/10 bg-white/5"
            onClick={() => setShowProfessorDialog(true)}
          >
            <div className="flex justify-center">
              <UserCircle2 className="text-blue-800" size={80} />
            </div>
            <h2 className="text-3xl font-bold text-center text-blue-800">
              Professor Dashboard
            </h2>
            <p className="text-center text-white text-lg" dir="rtl">
              لوحة تحكم الدكتور
            </p>
            <Button 
              className="w-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              دخول الأساتذة | Enter
            </Button>
          </Card>
        </div>
        )}
      </main>
      {/* Professor Login Dialog */}
      <Dialog open={showProfessorDialog} onOpenChange={setShowProfessorDialog} >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl" dir="rtl">
              دخول الدكتور
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label dir="rtl">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={professorEmail}
                onChange={(e) => setProfessorEmail(e.target.value)}
                placeholder="professor@university.edu"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label dir="rtl">كلمة السر</Label>
              <Input
                type="password"
                value={professorPassword}
                onChange={(e) => setProfessorPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleProfessorLogin()}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            <Button 
              onClick={handleProfessorLogin}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "جاري الدخول..." : "دخول"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Code Dialog */}
      <Dialog open={showStudentCodeDialog} onOpenChange={setShowStudentCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl" dir="rtl">
              دخول الطالب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label dir="rtl">كود الدكتور</Label>
              <Input
                value={studentProfessorCode}
                onChange={(e) => setStudentProfessorCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleStudentEnterWithCode()}
                placeholder="PROF-XXXXXX"
                className="text-center font-mono text-lg"
                dir="ltr"
                disabled={isVerifyingCode}
              />
              <p className="text-sm text-muted-foreground text-center" dir="rtl">
                أدخل الكود الذي أعطاه لك الدكتور للتسجيل
              </p>
            </div>
            <Button 
              onClick={handleStudentEnterWithCode}
              className="w-full"
              disabled={isVerifyingCode}
            >
              {isVerifyingCode ? "جاري التحقق..." : "تسجيل / دخول"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
