import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Clock, FileSpreadsheet, History } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

interface CourseSession {
  id: string;
  session_name: string;
  started_at: string;
  ends_at: string;
  is_active: boolean;
  attendance_count: number;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_major: string;
  registered_at: string;
  is_valid_location: boolean;
}

const COURSE_NAMES = {
  course1: { ar: "المقرر الأول", en: "Course 1" },
  course2: { ar: "المقرر الثاني", en: "Course 2" },
  course3: { ar: "المقرر الثالث", en: "Course 3" },
};

const CourseManagement = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [totalStudents, setTotalStudents] = useState(0);

  const courseName = courseId ? COURSE_NAMES[courseId as keyof typeof COURSE_NAMES] : null;

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

  useEffect(() => {
    checkPermission();
    fetchCourseSessions();
    fetchTotalStudents();
  }, [courseId, permissionsData]);

  const checkPermission = async () => {
    if (permissionsData) {
      const perms = permissionsData as any;
      if (!perms.courses) {
        toast.error(language === "ar" ? "عذراً، تم إلغاء صلاحية إدارة المقررات" : "Access denied");
        navigate('/professor', { replace: true });
      }
    }
  };

  const fetchCourseSessions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
        return;
      }

      // Fetch sessions for this course (you can filter by course name pattern)
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('professor_id', session.user.id)
        .ilike('session_name', `%${courseId}%`)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Count attendance for each session
      const sessionsWithCount = await Promise.all(
        (data || []).map(async (sess) => {
          const { count } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sess.id)
            .eq('is_valid_location', true);

          return {
            ...sess,
            attendance_count: count || 0,
          };
        })
      );

      setSessions(sessionsWithCount);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast.error(language === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalStudents = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    setTotalStudents(count || 0);
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      const session = sessions.find(s => s.id === sessionId);
      const csvContent = [
        ['Student Name', 'Major', 'Registration Time', 'Valid Location'].join(','),
        ...(data || []).map((record: AttendanceRecord) =>
          [
            record.student_name,
            record.student_major,
            new Date(record.registered_at).toLocaleString(),
            record.is_valid_location ? 'Yes' : 'No'
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${session?.session_name}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success(language === "ar" ? "تم تصدير البيانات" : "Data exported");
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error(language === "ar" ? "فشل التصدير" : "Export failed");
    }
  };

  if (!courseName) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-destructive">Invalid course ID</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/professor')} variant="outline" size="icon">
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {language === "ar" ? courseName.ar : courseName.en}
              </h1>
              <p className="text-muted-foreground">
                {language === "ar" ? "إدارة المقرر" : "Course Management"}
              </p>
            </div>
          </div>
          <Button onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")} variant="outline">
            {language === "ar" ? "EN" : "AR"}
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 shadow-lg border hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي الطلاب" : "Total Students"}
                </p>
                <p className="text-3xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-lg border hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "عدد الجلسات" : "Total Sessions"}
                </p>
                <p className="text-3xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-lg border hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <History className="h-10 w-10 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الجلسات النشطة" : "Active Sessions"}
                </p>
                <p className="text-3xl font-bold">
                  {sessions.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card className="p-6 shadow-xl border-2">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-primary" />
            <h2 className="text-xl font-bold">
              {language === "ar" ? "سجل الجلسات" : "Sessions History"}
            </h2>
          </div>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "لا توجد جلسات" : "No sessions found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "اسم الجلسة" : "Session Name"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "وقت البدء" : "Start Time"}</TableHead>
                    <TableHead>{language === "ar" ? "عدد الحاضرين" : "Attendees"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-center">{language === "ar" ? "تصدير" : "Export"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.session_name}</TableCell>
                      <TableCell>
                        {new Date(session.started_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        {new Date(session.started_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{session.attendance_count}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          session.is_active 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {session.is_active 
                            ? (language === "ar" ? "نشطة" : "Active")
                            : (language === "ar" ? "منتهية" : "Ended")
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => handleExportSession(session.id)}
                          variant="outline"
                          size="sm"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
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
  );
};

export default CourseManagement;
