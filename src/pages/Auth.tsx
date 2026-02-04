import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, GraduationCap, Lock, Mail, User, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { z } from "zod";

// Input validation schemas
const authSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

const signupSchema = authSchema.extend({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  major: z.string().trim().min(2, "Major must be at least 2 characters").max(100, "Major too long"),
});

type UserRole = "student" | "professor";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [major, setMajor] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const from = (location.state as any)?.from || (role === "student" ? "/student" : "/professor");
        navigate(from, { replace: true });
      }
    };
    checkUser();
  }, [navigate, location, role]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs using zod schemas
    if (isLogin) {
      const result = authSchema.safeParse({ email, password });
      if (!result.success) {
        const errorMessage = result.error.errors[0]?.message;
        toast.error(language === "ar" ? "بيانات غير صالحة" : errorMessage || "Invalid input");
        return;
      }
    } else {
      const result = signupSchema.safeParse({ email, password, fullName, major });
      if (!result.success) {
        const errorMessage = result.error.errors[0]?.message;
        toast.error(language === "ar" ? "بيانات غير صالحة" : errorMessage || "Invalid input");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }

        // Get user role
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const userRole = userRoles?.role || 'student';
        
        toast.success(language === "ar" ? "✅ تم تسجيل الدخول بنجاح" : "✅ Successfully logged in");
        
        // Navigate based on role
        const from = (location.state as any)?.from;
        if (from) {
          navigate(from, { replace: true });
        } else {
          navigate(userRole === "student" ? "/student" : "/professor", { replace: true });
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              major: major,
              role: 'student',
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error(language === "ar" ? "البريد الإلكتروني مسجل بالفعل" : "Email already registered");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success(
          language === "ar" 
            ? "✅ تم إنشاء الحساب بنجاح! جاري تسجيل الدخول..." 
            : "✅ Account created successfully! Logging you in..."
        );

        // Navigate based on role
        setTimeout(() => {
          navigate("/student", { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Auth error:', error);
      }
      toast.error(language === "ar" ? "حدث خطأ" : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "ar" ? "en" : "ar");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative">
      
      {/* Header */}
      <header className="relative z-10 flex flex-col items-center p-6 gap-4">
        <div className="w-full flex justify-end">
          <Button 
            onClick={toggleLanguage}
            variant="outline"
            className="text-primary"
          >
            {language === "ar" ? "EN" : "AR"}
          </Button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-glow-primary flex items-center justify-center gap-2 text-center">
          <Sparkles className="text-accent" />
          {language === "ar" ? "كايزن | التحسين المستمر" : "Kaizen | Continuous Improvement"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <Card className="card-3d float-animation w-full max-w-md p-8 space-y-6 shadow-2xl border-2">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Lock className="text-primary text-glow-primary" size={60} />
            </div>
            <h2 className="text-3xl font-bold text-glow-primary">
              {isLogin 
                ? (language === "ar" ? "تسجيل الدخول" : "Login")
                : (language === "ar" ? "إنشاء حساب جديد" : "Create Account")}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? (language === "ar" ? "أدخل بياناتك للدخول" : "Enter your credentials")
                : (language === "ar" ? "املأ البيانات لإنشاء حساب" : "Fill in the details to create an account")}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User size={16} />
                    {language === "ar" ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <Input
                    type="text"
                    placeholder={language === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className=""
                    dir={language === "ar" ? "rtl" : "ltr"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "ar" ? "التخصص" : "Major"}
                  </label>
                  <Input
                    type="text"
                    placeholder={language === "ar" ? "أدخل تخصصك" : "Enter your major"}
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className=""
                    dir={language === "ar" ? "rtl" : "ltr"}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={16} />
                {language === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <Input
                type="email"
                placeholder={language === "ar" ? "your@email.com" : "your@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=""
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock size={16} />
                {language === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <Input
                type="password"
                placeholder={language === "ar" ? "••••••••" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=""
                dir="ltr"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-bold pulse-glow shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              {isLoading
                ? (language === "ar" ? "جاري التحميل..." : "Loading...")
                : isLogin
                  ? (language === "ar" ? "تسجيل الدخول" : "Login")
                  : (language === "ar" ? "إنشاء حساب" : "Create Account")}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                {isLogin
                  ? (language === "ar" ? "ليس لديك حساب؟ إنشاء حساب جديد" : "Don't have an account? Sign up")
                  : (language === "ar" ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Login")}
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
