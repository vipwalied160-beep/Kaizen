import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CheckCircle2, XCircle, LogOut, History, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { validateGPSCoordinates, checkRateLimit } from "@/utils/validation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JitsiMeeting } from "../components/JitsiMeeting";

interface ActiveSession {
  id: string;
  session_name: string;
  professor_name: string;
  classroom_latitude: number;
  classroom_longitude: number;
  classroom_radius_meters: number;
  ends_at: string;
  professor_id: string;
}

interface Meeting {
  id: string;
  title: string;
  link: string;
  is_active: boolean;
}

const Student = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; major: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  
  // Professor info from localStorage
  const [professorCode, setProfessorCode] = useState<string>("");
  const [professorId, setProfessorId] = useState<string>("");
  const [professorName, setProfessorName] = useState<string>("");
  
  // Meetings
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showMeetings, setShowMeetings] = useState(false);
  const [activeJitsiRoom, setActiveJitsiRoom] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }
  }, []);

  useEffect(() => {
    // Get professor info from localStorage
    const storedCode = localStorage.getItem('student_professor_code');
    const storedId = localStorage.getItem('student_professor_id');
    const storedName = localStorage.getItem('student_professor_name');
    
    if (!storedCode || !storedId) {
      toast.error(language === "ar" ? "يرجى إدخال كود الدكتور أولاً" : "Please enter professor code first");
      navigate('/', { replace: true });
      return;
    }
    
    setProfessorCode(storedCode);
    setProfessorId(storedId);
    setProfessorName(storedName || '');

    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { state: { from: '/student' }, replace: true });
        return;
      }
      setSession(session);
      setUser(session.user);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, major')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth', { state: { from: '/student' }, replace: true });
      } else {
        setSession(session);
        setUser(session.user);
      }
    });

    // Generate enhanced device fingerprint
    const generateFingerprint = async () => {
      try {
        const getWebRTCIPs = (): Promise<string[]> => {
          return new Promise((resolve) => {
            const ips: string[] = [];
            // @ts-ignore
            const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            
            if (!RTCPeerConnection) {
              resolve(ips);
              return;
            }
            try {
              const pc = new RTCPeerConnection({ iceServers: [] });
              pc.createDataChannel('');
              pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
              
              pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) {
                  pc.close();
                  resolve(ips);
                  return;
                }
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                const match = ipRegex.exec(ice.candidate.candidate);
                if (match) ips.push(match[1]);
              };
              
              setTimeout(() => {
                pc.close();
                resolve(ips);
              }, 1000);
            } catch (e) {
              resolve(ips);
            }
          });
        };

        const webrtcIPs = await getWebRTCIPs();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasFingerprint = '';
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('fingerprint', 2, 2);
          canvasFingerprint = canvas.toDataURL().slice(-50);
        }

        const data = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          screenResolution: `${screen.width}x${screen.height}`,
          colorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          touchSupport: 'ontouchstart' in window,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: (navigator as any).deviceMemory,
          canvasFingerprint,
          webrtcIPs,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack,
        };
        
        const fingerprint = btoa(JSON.stringify(data));
        setDeviceFingerprint(fingerprint);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error generating fingerprint:', error);
        }
        const basicData = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${screen.width}x${screen.height}`,
        };
        setDeviceFingerprint(btoa(JSON.stringify(basicData)));
      }
    };
    
    generateFingerprint();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, language]);

  useEffect(() => {
    if (professorId) {
      fetchActiveSession();
      fetchMeetings();
      
      // Subscribe to session updates
      const channel = supabase
        .channel('session-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_sessions'
          },
          () => fetchActiveSession()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'professor_meetings'
          },
          () => fetchMeetings()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [professorId]);

  const fetchActiveSession = async () => {
    if (!professorId) return;
    
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('professor_id', professorId)
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

  const fetchMeetings = async () => {
    if (!professorId) return;
    
    const { data, error } = await supabase
      .from('professor_meetings')
      .select('*')
      .eq('professor_id', professorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching meetings:', error);
      }
      return;
    }

    setMeetings(data || []);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRegisterAttendance = useCallback(async () => {
    if (!user || !profile) {
      toast.error(language === "ar" ? "جاري تحميل بيانات المستخدم..." : "Loading user data...");
      return;
    }

    if (!activeSession) {
      toast.error(language === "ar" ? "❌ التسجيل مغلق حاليًا" : "❌ Registration is closed");
      return;
    }

    // Rate limiting check - 3 attempts per minute
    const rateLimitKey = `attendance_${user.id}_${activeSession.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 3, 60000);
    
    if (!rateLimit.allowed) {
      toast.error(
        language === "ar" 
          ? `⏳ انتظر ${rateLimit.resetInSeconds} ثانية قبل المحاولة مرة أخرى` 
          : `⏳ Wait ${rateLimit.resetInSeconds} seconds before trying again`
      );
      return;
    }

    setIsRegistering(true);

    try {
      // Check if already registered
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRecord) {
        toast.warning(language === "ar" ? "⚠ لقد سجلت بالفعل" : "⚠ Already registered");
        setIsRegistering(false);
        return;
      }

      // Check device fingerprint
      const { data: existingDevice } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('fingerprint_hash', deviceFingerprint)
        .maybeSingle();

      if (existingDevice) {
        toast.error(
          language === "ar" 
            ? "🚫 هذا الجهاز مسجل بالفعل في هذه الجلسة" 
            : "🚫 This device is already registered for this session",
          { duration: 6000 }
        );
        setIsRegistering(false);
        return;
      }

      // Get GPS location
      if (!navigator.geolocation) {
        toast.error(language === "ar" ? "المتصفح لا يدعم GPS" : "Browser doesn't support GPS");
        setIsRegistering(false);
        return;
      }

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
        setIsRegistering(false);
        return;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        activeSession.classroom_latitude,
        activeSession.classroom_longitude
      );

      const isValidLocation = distance <= activeSession.classroom_radius_meters;

      if (!isValidLocation) {
        toast.error(
          language === "ar" 
            ? `🚫 أنت خارج نطاق القاعة - لا يمكن التسجيل` 
            : `🚫 Outside classroom area - Cannot register`,
          { duration: 5000 }
        );
        setIsRegistering(false);
        return;
      }

      // Insert attendance record
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: activeSession.id,
          user_id: user.id,
          student_name: profile.full_name,
          student_major: profile.major,
          student_latitude: latitude,
          student_longitude: longitude,
          distance_from_classroom: distance,
          device_fingerprint: deviceFingerprint,
          ip_address: '',
          user_agent: navigator.userAgent,
          is_valid_location: isValidLocation,
          session_name: activeSession.session_name,
          professor_code: professorCode,
        });

      // Insert device fingerprint
      await supabase
        .from('device_fingerprints')
        .insert({
          user_id: user.id,
          session_id: activeSession.id,
          student_name: profile.full_name,
          fingerprint_hash: deviceFingerprint,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast.warning(language === "ar" ? "⚠ لقد سجلت بالفعل" : "⚠ Already registered");
        } else {
          toast.error(language === "ar" ? "حدث خطأ أثناء التسجيل" : "Error during registration");
        }
        setIsRegistering(false);
        return;
      }

      toast.success(
        language === "ar" 
          ? `✅ تم التسجيل بنجاح في ${activeSession.session_name}` 
          : `✅ Successfully registered in ${activeSession.session_name}`,
        { duration: 4000 }
      );
      
      setIsRegistering(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Registration error:', error);
      }
      toast.error(language === "ar" ? "حدث خطأ" : "An error occurred");
      setIsRegistering(false);
    }
  }, [user, profile, activeSession, language, deviceFingerprint, professorCode]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === "ar" ? "en" : "ar");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('student_professor_code');
    localStorage.removeItem('student_professor_id');
    localStorage.removeItem('student_professor_name');
    navigate('/', { replace: true });
    toast.success(language === "ar" ? "تم تسجيل الخروج" : "Logged out");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative flex flex-col overflow-hidden">
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
          <source src="/P.mp4" type="video/mp4" />
        </video>
      </div>

      {activeJitsiRoom && profile && (
        <JitsiMeeting
          roomName={activeJitsiRoom}
          displayName={`${profile.full_name} | ${user?.email || ''}`}
          onClose={() => setActiveJitsiRoom(null)}
          isProfessor={false}
        />
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex flex-col items-center p-6 gap-4">
        <div className="w-full flex justify-end items-center">
          <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowMeetings(true)}
            variant="outline"
            className="bg-transparent border-white/10 hover:bg-white/10 text-green-500 relative"
            size="icon"
            title={language === "ar" ? "الاجتماعات" : "Meetings"}
          >
            <Video size={20} />
            {meetings.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {meetings.length}
              </span>
            )}
          </Button>
          
          <Button 
            onClick={() => navigate('/student-report')}
            variant="outline"
            className="bg-transparent border-white/10 hover:bg-white/10 text-primary"
            size="icon"
            title={language === "ar" ? "سجل الحضور" : "Attendance History"}
          >
            <History size={20} />
          </Button>
          
          <Button 
            onClick={toggleLanguage}
            variant="outline"
            className="bg-transparent border-white/10 hover:bg-white/10 text-primary"
          >
            {language === "ar" ? "EN" : "AR"}
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-transparent border-white/10 hover:bg-white/10 text-destructive"
            size="icon"
          >
            <LogOut size={20} />
          </Button>
        </div>
        </div>
        
        <h1 className="text-xl md:text-3xl font-bold text-glow-primary text-center">
          {language === "ar" ? "كايزن | التحسين المستمر" : "Kaizen | Continuous Improvement"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="card-3d float-animation w-full max-w-md p-8 space-y-6 shadow-2xl border-white/10 bg-black/30">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-glow-primary">
              {language === "ar" ? "بوابة الطالب" : "Student Portal"}
            </h2>
            <p className="text-muted-foreground">
              {language === "ar" ? `مرحباً ${profile?.full_name}` : `Welcome ${profile?.full_name}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile?.major}
            </p>
            {professorName && (
              <p className="text-sm text-primary font-semibold">
                {language === "ar" ? `دكتور: ${professorName}` : `Professor: ${professorName}`}
              </p>
            )}
          </div>

          {/* Session Status */}
          {activeSession ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success">
              <CheckCircle2 className="text-success" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-success">
                  {language === "ar" ? "جلسة نشطة" : "Active Session"}
                </p>
                <p className="text-success/80">{activeSession.session_name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive">
              <XCircle className="text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                {language === "ar" ? "لا توجد جلسة نشطة" : "No active session"}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleRegisterAttendance}
              disabled={isRegistering || !activeSession}
              className="w-full h-14 text-lg font-bold pulse-glow disabled:opacity-50 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              {isRegistering ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {language === "ar" ? "جاري التسجيل..." : "Registering..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MapPin size={24} />
                  {language === "ar" ? "تسجيل الحضور" : "Register Attendance"}
                </span>
              )}
            </Button>
          </div>
        </Card>
      </main>

      <footer className="p-4 text-center">
      </footer>
      </div>

      {/* Meetings Dialog */}
      <Dialog open={showMeetings} onOpenChange={setShowMeetings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {language === "ar" ? "الاجتماعات النشطة" : "Active Meetings"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {meetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === "ar" ? "لا توجد اجتماعات نشطة" : "No active meetings"}
              </p>
            ) : (
              meetings.map((meeting) => (
                <Card key={meeting.id} className="p-4 bg-success/10 border-success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {meeting.link}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!profile) {
                           toast.error(language === "ar" ? "جاري تحميل البيانات..." : "Loading profile data...");
                           return;
                        }
                        const link = meeting.link;
                        if (link.includes('meet.jit.si')) {
                           setActiveJitsiRoom(link);
                           setShowMeetings(false);
                        } else {
                           window.open(link, '_blank');
                        }
                      }}
                      className="bg-success hover:bg-success/90"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      {language === "ar" ? "دخول الاجتماع" : "Join Meeting"}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Student;