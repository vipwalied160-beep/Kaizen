import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Play, StopCircle, Download, MapPin, Clock, Users, LogOut, History, Trash2, Plus, Key, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { NavigationBar } from "@/components/NavigationBar";
import { validateGPSCoordinates, validateCourseName } from "@/utils/validation";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_major: string;
  registered_at: string;
  distance_from_classroom: number;
  is_valid_location: boolean;
  student_latitude: number;
  student_longitude: number;
}

interface ActiveSession {
  id: string;
  session_name: string;
  professor_name: string;
  duration_minutes: number;
  ends_at: string;
  classroom_latitude: number;
  classroom_longitude: number;
}

interface PastSession {
  id: string;
  session_name: string;
  started_at: string;
  ends_at: string;
  duration_minutes: number;
  is_active: boolean;
}

const Professor = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [duration, setDuration] = useState("15");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [professorLocation, setProfessorLocation] = useState<{lat: number; lng: number} | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [selectedSessionRecords, setSelectedSessionRecords] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }
  }, []);

  // Course management
  const [courses, setCourses] = useState<string[]>(["Data Science", "Data Engineering", "Internet Applications"]);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  // Professor code
  const [professorCode, setProfessorCode] = useState<string>("");

  // Professor permissions
  interface ProfessorPermissions {
    attendance: boolean;
    grades: boolean;
    exams: boolean;
    meetings: boolean;
    courses: boolean;
  }
  const [permissions, setPermissions] = useState<ProfessorPermissions>({
    attendance: false,
    grades: false,
    exams: false,
    meetings: false,
    courses: false,
  });

  const { data: professorData } = useQuery({
    queryKey: ['professor-dashboard-data'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'professor')
        .maybeSingle();

      if (!roleData) return { unauthorized: true };

      const { data: codeData } = await supabase
        .from('professor_codes')
        .select('unique_code, permissions')
        .eq('professor_id', session.user.id)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      return { session, codeData, profileData };
    },
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    const isProfessorAuth = localStorage.getItem('professor_authenticated') === 'true';
    if (!isProfessorAuth) {
      navigate('/', { replace: true });
      return;
    }

    if (professorData) {
      if (professorData.unauthorized) {
        toast.error('Unauthorized - Professor access only');
        navigate('/', { replace: true });
        return;
      }

      const { session, codeData, profileData } = professorData;
      setUser(session.user);
      setSession(session);

      if (codeData) {
        setProfessorCode(codeData.unique_code);
        if (codeData.permissions) {
          setPermissions(codeData.permissions as unknown as ProfessorPermissions);
        }
      }

      if (profileData) {
        setProfile(profileData);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, professorData]);

  useEffect(() => {
    if (user) {
      fetchActiveSession();
      
      const channel = supabase
        .channel('attendance-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records'
          },
          () => fetchAttendanceRecords()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      fetchAttendanceRecords();
      
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(activeSession.ends_at).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleCloseAttendance();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const fetchActiveSession = async () => {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching session:', error);
      }
      return;
    }

    setActiveSession(data);
  };

  const fetchAttendanceRecords = async () => {
    if (!activeSession) return;

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('registered_at', { ascending: false })
      .limit(1000);

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching records:', error);
      }
      return;
    }

    setAttendanceRecords(data || []);
  };

  const handleOpenAttendance = useCallback(async () => {
    if (!permissions.attendance) {
      toast.error(language === "ar" ? "عذراً، ليس لديك صلاحية فتح الحضور" : "Permission denied");
      return;
    }

    if (!selectedCourse) {
      toast.error(language === "ar" ? "يرجى اختيار المقرر أولاً" : "Please select a course first");
      return;
    }

    // Validate course name
    const courseValidation = validateCourseName(selectedCourse);
    if (!courseValidation.valid) {
      toast.error(language === "ar" ? "اسم المقرر غير صالح" : courseValidation.error || "Invalid course name");
      return;
    }

    if (!window.isSecureContext) {
      toast.error(language === "ar" 
        ? "⚠️ يجب استخدام اتصال آمن (HTTPS) أو localhost لتشغيل الموقع الجغرافي" 
        : "⚠️ Secure connection (HTTPS) or localhost is required for location services");
      return;
    }
    
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Validate GPS coordinates
      const gpsValidation = validateGPSCoordinates(latitude, longitude);
      if (!gpsValidation.valid) {
        toast.error(language === "ar" ? "إحداثيات GPS غير صالحة" : "Invalid GPS coordinates");
        setIsLoading(false);
        return;
      }

      const durationMinutes = parseInt(duration);
      const endsAt = new Date(Date.now() + durationMinutes * 60000);

      const { data: newSession, error } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: selectedCourse,
          professor_id: user?.id,
          professor_name: profile?.full_name || 'Professor',
          classroom_latitude: latitude,
          classroom_longitude: longitude,
          classroom_radius_meters: 100,
          duration_minutes: durationMinutes,
          ends_at: endsAt.toISOString(),
          course_id: selectedCourse
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession({
        id: newSession.id,
        session_name: newSession.session_name,
        professor_name: newSession.professor_name,
        duration_minutes: newSession.duration_minutes,
        ends_at: newSession.ends_at,
        classroom_latitude: newSession.classroom_latitude,
        classroom_longitude: newSession.classroom_longitude,
      });
      
      setProfessorLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      await supabase
        .from('notifications')
        .insert({
          title: language === "ar" ? "جلسة جديدة" : "New Session",
          message: language === "ar" 
            ? `تم فتح جلسة: ${newSession.session_name}`
            : `Session opened: ${newSession.session_name}`,
          type: 'session',
          user_id: null
        });
      
      toast.success(language === "ar" ? "✅ تم فتح باب التسجيل وإرسال الإشعارات" : "✅ Registration opened and notifications sent");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error opening attendance:', error);
      }
      
      let errorMessage = error.message || (language === "ar" ? "حدث خطأ أثناء فتح التسجيل" : "Error opening registration");
      
      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = language === "ar" ? "🚫 تم رفض إذن الوصول للموقع. يرجى تفعيله من المتصفح." : "Location permission denied.";
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = language === "ar" ? "⚠️ تعذر تحديد الموقع. تأكد من تفعيل GPS." : "Location unavailable.";
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = language === "ar" ? "⏳ انتهت مهلة تحديد الموقع." : "Location request timed out.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, language, duration, user, profile]);

  const handleCloseAttendance = async () => {
    if (!activeSession) return;

    const { error } = await supabase
      .from('attendance_sessions')
      .update({ is_active: false })
      .eq('id', activeSession.id);

    if (error) {
      toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
      return;
    }

    toast.success(language === "ar" ? "❌ تم إغلاق التسجيل" : "❌ Registration closed");
    setActiveSession(null);
    setAttendanceRecords([]);
  };

  const handleExport = () => {
    if (attendanceRecords.length === 0) {
      toast.error(language === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
      return;
    }

    const csv = [
      ['Student Name', 'Major', 'Time', 'Distance (m)', 'Status'],
      ...attendanceRecords.map(record => [
        record.student_name,
        record.student_major,
        new Date(record.registered_at).toLocaleString(),
        Math.round(record.distance_from_classroom),
        record.is_valid_location ? 'Valid' : 'Invalid'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(language === "ar" ? "تم تصدير التقرير" : "Report exported");
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "ar" ? "en" : "ar");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('professor_authenticated');
    navigate('/', { replace: true });
    toast.success(language === "ar" ? "تم الخروج" : "Logged out");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchPastSessions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('id, session_name, started_at, ends_at, duration_minutes, is_active')
      .eq('professor_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      toast.error(language === "ar" ? "فشل تحميل السجلات" : "Failed to load records");
      return;
    }

    setPastSessions(data || []);
  };

  const fetchSessionRecords = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('registered_at', { ascending: false })
      .limit(1000);

    if (error) {
      toast.error(language === "ar" ? "فشل تحميل سجلات الجلسة" : "Failed to load session records");
      return;
    }

    setSelectedSessionRecords(data || []);
    
    if (data && data.length > 0) {
      exportSessionToExcel(data, sessionId);
    }
  };

  const exportSessionToExcel = (records: AttendanceRecord[], sessionId: string) => {
    const session = pastSessions.find(s => s.id === sessionId);
    const sessionName = session?.session_name || 'Session';
    
    const csvContent = [
      ['Student Name', 'Major', 'Registration Time', 'Distance (m)', 'Valid Location'].join(','),
      ...records.map(record => 
        [
          record.student_name,
          record.student_major,
          new Date(record.registered_at || '').toLocaleString(),
          Math.round(record.distance_from_classroom),
          record.is_valid_location ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionName}_${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(language === "ar" ? "✅ تم تصدير السجل" : "✅ Record exported");
  };

  const handleAddCourse = useCallback(() => {
    const trimmedName = newCourseName.trim();
    
    // Validate course name
    const validation = validateCourseName(trimmedName);
    if (!validation.valid) {
      toast.error(language === "ar" ? "اسم المقرر غير صالح" : validation.error || "Invalid course name");
      return;
    }
    
    if (courses.includes(trimmedName)) {
      toast.error(language === "ar" ? "هذا المقرر موجود بالفعل" : "This course already exists");
      return;
    }
    
    setCourses(prev => [...prev, trimmedName]);
    setNewCourseName("");
    setIsAddCourseDialogOpen(false);
    toast.success(language === "ar" ? "✅ تم إضافة المقرر" : "✅ Course added");
  }, [newCourseName, courses, language]);

  const handleDeleteCourse = (course: string) => {
    if (courses.length <= 1) {
      toast.error(language === "ar" ? "يجب أن يكون هناك مقرر واحد على الأقل" : "Must have at least one course");
      return;
    }
    setCourses(prev => prev.filter(c => c !== course));
    if (selectedCourse === course) {
      setSelectedCourse("");
    }
    toast.success(language === "ar" ? "✅ تم حذف المقرر" : "✅ Course deleted");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(professorCode);
      toast.success(language === "ar" ? "✅ تم نسخ الكود" : "✅ Code copied");
    } catch (error) {
      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = professorCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success(language === "ar" ? "✅ تم نسخ الكود" : "✅ Code copied");
      } catch (err) {
        toast.error(language === "ar" ? "فشل نسخ الكود" : "Failed to copy code");
      }
      document.body.removeChild(textArea);
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = attendanceRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative overflow-hidden">
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
          {/* ⬇️⬇️ ضع رابط الفيديو الخاص بك هنا ⬇️⬇️ */}
          <source src="/M.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative z-10">
        <NavigationBar language={language} permissions={permissions} />
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-glow-primary mb-2">
              {language === "ar" ? "لوحة تحكم الدكتور" : "Professor Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {profile?.full_name && `${language === "ar" ? "أهلاً" : "Welcome"}, ${profile.full_name}`}
            </p>
            {activeSession && (
              <p className="text-sm text-primary font-semibold mt-1">
                {language === "ar" ? "الجلسة النشطة: " : "Active Session: "}
                {activeSession.session_name}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {professorCode && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-bold select-all">{professorCode}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-6 w-6 ml-1 hover:bg-background"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPastSessions}
                >
                  <History className="mr-2 h-4 w-4" />
                  {language === "ar" ? "السجل" : "History"}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{language === "ar" ? "سجل الجلسات" : "Session History"}</SheetTitle>
                  <SheetDescription>
                    {language === "ar" ? "الجلسات السابقة" : "Past sessions"}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {pastSessions.map((session) => (
                    <Card key={session.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{session.session_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.started_at).toLocaleString('ar-EG')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "المدة:" : "Duration:"} {session.duration_minutes} {language === "ar" ? "دقيقة" : "min"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSessionRecords(session.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "ar" ? "تصدير" : "Export"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
            >
              {language === "ar" ? "English" : "عربي"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-destructive/20 text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {language === "ar" ? "خروج" : "Logout"}
            </Button>
          </div>
        </div>

        <Card className="card-3d p-6 shadow-2xl border-white/10 bg-black/30">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            {language === "ar" ? "لوحة التحكم" : "Control Panel"}
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={language === "ar" ? "اختر المقرر" : "Select Course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{language === "ar" ? "إضافة مقرر" : "Add Course"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder={language === "ar" ? "اسم المقرر" : "Course name"}
                    />
                    <Button onClick={handleAddCourse} className="w-full shadow-md hover:shadow-lg transition-all">
                      {language === "ar" ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedCourse && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive"
                  onClick={() => handleDeleteCourse(selectedCourse)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
                <SelectItem value="30">30 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
                <SelectItem value="45">45 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
                <SelectItem value="60">60 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
                <SelectItem value="90">90 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
                <SelectItem value="120">120 {language === "ar" ? "دقيقة" : "min"}</SelectItem>
              </SelectContent>
            </Select>
            
            {!activeSession ? (
              <Button
                onClick={handleOpenAttendance}
                disabled={isLoading}
                className="pulse-glow shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Play className="mr-2 h-4 w-4" />
                {language === "ar" ? "فتح التسجيل" : "Open Registration"}
              </Button>
            ) : (
              <Button
                onClick={handleCloseAttendance}
                variant="destructive"
                className="pulse-glow shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            )}
          </div>

          {activeSession && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">
                    {language === "ar" ? "الوقت المتبقي" : "Time Remaining"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-glow-primary">{formatTime(timeRemaining)}</p>
              </Card>
              
              <Card className="p-4 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">
                    {language === "ar" ? "عدد الطلاب" : "Student Count"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary">{attendanceRecords.length}</p>
              </Card>
              
              <Card className="p-4 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  <span className="text-sm text-gray-400">
                    {language === "ar" ? "الموقع" : "Location"}
                  </span>
                </div>
                <p className="text-sm font-medium text-glow-accent">
                  {professorLocation ? `${professorLocation.lat.toFixed(4)}, ${professorLocation.lng.toFixed(4)}` : "N/A"}
                </p>
              </Card>
            </div>
          )}

          {activeSession && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {language === "ar" ? "التسجيلات الحية" : "Live Registrations"}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {language === "ar" ? "تصدير" : "Export"}
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{language === "ar" ? "التخصص" : "Major"}</TableHead>
                      <TableHead>{language === "ar" ? "الوقت" : "Time"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.student_name}</TableCell>
                        <TableCell>{record.student_major}</TableCell>
                        <TableCell>{new Date(record.registered_at).toLocaleTimeString('ar-EG')}</TableCell>
                        <TableCell>
                          {record.is_valid_location ? (
                            <span className="text-success">✅</span>
                          ) : (
                            <span className="text-destructive">❌</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    {language === "ar" ? "السابق" : "Previous"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {language === "ar" ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {language === "ar" ? "التالي" : "Next"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Professor;
