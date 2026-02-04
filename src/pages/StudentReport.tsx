import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  id: string;
  session_id: string;
  registered_at: string;
  is_valid_location: boolean;
  session_name: string;
  course_name?: string;
}

const StudentReport = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; major: string } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { state: { from: '/student-report' }, replace: true });
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, major')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      fetchAttendanceRecords(session.user.id);
    };

    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }



    checkAuth();
  }, [navigate]);

  const fetchAttendanceRecords = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          session_id,
          registered_at,
          is_valid_location,
          attendance_sessions(session_name)
        `)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      const records = (data || []).map((record: any) => ({
        id: record.id,
        session_id: record.session_id,
        registered_at: record.registered_at,
        is_valid_location: record.is_valid_location,
        session_name: record.attendance_sessions?.session_name || 'N/A',
      }));

      setAttendanceRecords(records);
    } catch (error: any) {
      console.error('Error fetching records:', error);
      toast.error(language === "ar" ? "فشل تحميل السجلات" : "Failed to load records");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
    toast.success(language === "ar" ? "تم تسجيل الخروج" : "Logged out");
  };

  const filteredRecords = selectedCourse === "all" 
    ? attendanceRecords 
    : attendanceRecords.filter(r => r.course_name === selectedCourse);

  const totalSessions = filteredRecords.length;
  const attendedSessions = filteredRecords.filter(r => r.is_valid_location).length;
  const missedSessions = totalSessions - attendedSessions;

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
          <source src="/P.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {language === "ar" ? "تقرير الحضور والغياب" : "Attendance Report"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar" ? `مرحباً ${profile?.full_name}` : `Welcome ${profile?.full_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")} variant="outline">
              {language === "ar" ? "EN" : "AR"}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="icon">
              <LogOut />
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
          <Card className="p-6 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold mb-2">
              {language === "ar" ? "إجمالي الجلسات" : "Total Sessions"}
            </h3>
            <p className="text-3xl font-bold text-primary">{totalSessions}</p>
          </Card>
          <Card className="p-6 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold mb-2 text-success">
              {language === "ar" ? "الحضور" : "Attended"}
            </h3>
            <p className="text-3xl font-bold text-success">{attendedSessions}</p>
          </Card>
          <Card className="p-6 shadow-lg border-white/10 bg-black/30 hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold mb-2 text-destructive">
              {language === "ar" ? "الغياب" : "Missed"}
            </h3>
            <p className="text-3xl font-bold text-destructive">{missedSessions}</p>
          </Card>
        </div>


        {/* Attendance Table */}
        <Card className="p-4 md:p-6 w-full shadow-xl border-white/10 bg-black/30">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "لا توجد سجلات" : "No records found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "اسم الجلسة" : "Session Name"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "الوقت" : "Time"}</TableHead>
                    <TableHead className="text-center">{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.session_name}</TableCell>
                      <TableCell>
                        {new Date(record.registered_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        {new Date(record.registered_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.is_valid_location ? (
                          <CheckCircle className="inline-block text-success" />
                        ) : (
                          <XCircle className="inline-block text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
      </div>

    </div>
  );
};

export default StudentReport;
