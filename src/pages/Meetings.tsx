import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Video, Plus, Copy, ExternalLink, Trash2, Zap } from "lucide-react";
import { NavigationBar } from "@/components/NavigationBar";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { JitsiMeeting } from "../components/JitsiMeeting";

interface Meeting {
  id: string;
  title: string;
  link: string;
  is_active: boolean;
  created_at: string;
}

const Meetings = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    attendance: false,
    grades: false,
    exams: false,
    meetings: false,
    courses: false,
  });
  const [activeJitsiRoom, setActiveJitsiRoom] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }
  }, []);

  const { data: permissionsData } = useQuery({
    queryKey: ['professor-permissions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase
        .from('professor_codes')
        .select('permissions')
        .eq('professor_id', session.user.id)
        .maybeSingle();
      return data?.permissions;
    }
  });

  // Check professor authentication
  useEffect(() => {
    const isProfessorAuth = localStorage.getItem('professor_authenticated') === 'true';
    if (!isProfessorAuth) {
      navigate('/', { replace: true });
      return;
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Verify professor role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'professor')
          .maybeSingle();

        if (!roleData) {
          toast.error(language === "ar" ? "غير مصرح" : "Unauthorized");
          navigate('/', { replace: true });
          return;
        }

        // Check permissions
        if (permissionsData) {
          const perms = permissionsData as any;
          setPermissions(perms);
          if (!perms.meetings) {
            toast.error(language === "ar" ? "عذراً، تم إلغاء صلاحية الاجتماعات" : "Access denied");
            navigate('/professor', { replace: true });
            return;
          }
        }

        setUser(session.user);
        fetchMeetings(session.user.id);
      } else {
        navigate('/', { replace: true });
      }
      setIsLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchMeetings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, language, permissionsData]);

  const fetchMeetings = async (professorId: string) => {
    const { data, error } = await supabase
      .from('professor_meetings')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching meetings:', error);
      }
      return;
    }

    setMeetings(data || []);
  };

  const handleStartInstantMeeting = async () => {
    if (!user) {
      toast.error(language === "ar" ? "يجب تسجيل الدخول" : "Must be logged in");
      return;
    }

    // Generate a unique room ID
    const roomId = `Kaizen-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${roomId}`;
    const title = language === "ar" 
      ? `محاضرة مباشرة - ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
      : `Live Lecture - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const { error } = await supabase
      .from('professor_meetings')
      .insert({
        professor_id: user.id,
        title: title,
        link: meetingLink,
        is_active: true,
      });

    if (error) {
      toast.error(language === "ar" ? "فشل بدء الاجتماع" : "Failed to start meeting");
      return;
    }

    toast.success(language === "ar" ? "✅ تم بدء الاجتماع" : "✅ Meeting started");
    fetchMeetings(user.id);
    setActiveJitsiRoom(meetingLink); // Pass full link to be consistent
  };

  const handleDeleteMeeting = async (id: string) => {
    const { error } = await supabase
      .from('professor_meetings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(language === "ar" ? "فشل حذف الاجتماع" : "Failed to delete meeting");
      return;
    }

    toast.success(language === "ar" ? "✅ تم حذف الاجتماع" : "✅ Meeting deleted");
    if (user) fetchMeetings(user.id);
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('professor_meetings')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error(language === "ar" ? "فشل تحديث الاجتماع" : "Failed to update meeting");
      return;
    }

    toast.success(language === "ar" ? "✅ تم تحديث الاجتماع" : "✅ Meeting updated");
    if (user) fetchMeetings(user.id);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(language === "ar" ? "✅ تم نسخ الرابط" : "✅ Link copied");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success(language === "ar" ? "✅ تم نسخ الرابط" : "✅ Link copied");
      } catch (e) {
        toast.error(language === "ar" ? "فشل نسخ الرابط" : "Failed to copy link");
      }
      document.body.removeChild(textArea);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
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
            <source src="/M.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <source src="/f.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Jitsi Meeting will overlay everything due to its own styling */}
      {activeJitsiRoom && user && (
        <JitsiMeeting
          roomName={activeJitsiRoom}
          displayName={`Dr. ${user.email?.split('@')[0] || 'Professor'}`}
          onClose={() => setActiveJitsiRoom(null)}
          isProfessor={true}
        />
      )}

      <div className="relative z-10">
        <NavigationBar language={language} permissions={permissions} />
        <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Video className="h-8 w-8" />
              {language === "ar" ? "الاجتماعات والمحاضرات" : "Meetings & Lectures"}
            </h1>
            <Button onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")} variant="outline">
              {language === "ar" ? "EN" : "AR"}
            </Button>
          </div>

          {/* Add Meeting */}
          <Card className="p-4 shadow-xl border-white/10 bg-black/30">
            <h3 className="font-semibold mb-4">
              {language === "ar" ? "إنشاء اجتماع" : "Create Meeting"}
            </h3>
            <Button onClick={handleStartInstantMeeting} className="w-full bg-gradient-to-r from-gray-700 to-purple-600 hover:from-gray-800 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Zap className="mr-2 h-4 w-4 fill-current" />
              {language === "ar" ? "بدء اجتماع فوري (فيديو مباشر)" : "Start Instant Live Meeting"}
            </Button>
        </Card>
          
          {/* Meetings List */}
          <Card className="p-4 shadow-xl border-white/10 bg-black/30">
          <h3 className="font-semibold mb-4">
            {language === "ar" ? "الاجتماعات" : "Meetings"} ({meetings.length})
          </h3>
          {meetings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "لا توجد اجتماعات" : "No meetings yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className={`p-4 shadow-md hover:shadow-lg transition-all ${meeting.is_active ? 'bg-success/10 border-success' : 'border-white/10 bg-black/30'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{meeting.title}</h4>
                        {meeting.is_active && (
                          <span className="text-xs bg-success text-success-foreground px-2 py-0.5 rounded">
                            {language === "ar" ? "نشط" : "Active"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {meeting.link}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(meeting.link)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(meeting.link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={meeting.is_active ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(meeting.id, meeting.is_active)}
                      >
                        {meeting.is_active 
                          ? (language === "ar" ? "إيقاف" : "Stop") 
                          : (language === "ar" ? "تفعيل" : "Activate")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Meetings;