import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { X, Save, ChevronLeft, ChevronRight, Plus, Trash2, Upload, FileDown, BookOpen, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { NavigationBar } from "@/components/NavigationBar";
import { WordExportDialog } from "@/components/WordExportDialog";
import { importStudentsFromFile } from "@/utils/importStudentsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface StudentGrade {
  id: string;
  student_name: string;
  student_major: string;
  quiz1: number;
  quiz2: number;
  midterm: number;
  final: number;
  rating: number;
  sum: number;
  degree: string;
  course_id?: string;
  [key: string]: any;
}

// Security: Removed hardcoded credentials - uses proper authentication

const GradesManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [newStudent, setNewStudent] = useState({
    student_name: "",
    student_major: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWordExportOpen, setIsWordExportOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    quiz1: true,
    quiz2: true,
    midterm: true,
    final: true,
    sum: true,
    degree: true,
    rating: true
  });
  const [searchId, setSearchId] = useState("");
  const [permissions, setPermissions] = useState({
    attendance: false,
    grades: false,
    exams: false,
    meetings: false,
    courses: false,
  });
  
  // Course management - No limit
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState<{key: string, label: string}[]>([]);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [activeCourses, setActiveCourses] = useState<string[]>([]);
  
  const studentsPerPage = 25;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3;
    }
  }, []);
  
  // Filter students by search ID and course
  const filteredStudents = students.filter(student => {
    const matchesCourse = selectedCourse ? student.course_id === selectedCourse : !student.course_id;
    const matchesSearch = searchId 
      ? students.indexOf(student) + 1 === parseInt(searchId)
      : true;
    return matchesCourse && matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

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
    const initializeData = async () => {
      // Removed setIsLoading(true) to prevent flashing/slowness on navigation
      try {
        // Check if user is authenticated as professor
        const isProfessorAuth = localStorage.getItem('professor_authenticated') === 'true';
        if (!isProfessorAuth) {
          navigate('/', { replace: true });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/', { replace: true });
          return;
        }

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
          if (!perms.grades) {
            toast.error(language === "ar" ? "عذراً، تم إلغاء صلاحية إدارة الدرجات" : "Access denied");
            navigate('/professor', { replace: true });
            return;
          }
        }

        // Check if there's existing data
        const { data: studentsData } = await supabase
          .from('students_grades')
          .select('*')
          .eq('professor_id', session.user.id)
          .limit(1);
        
        if (!studentsData || studentsData.length === 0) {
          try {
            await importStudentsFromFile();
            toast.success(language === "ar" ? "تم تحميل بيانات الطلاب بنجاح" : "Student data loaded successfully");
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error loading initial data:', error);
            }
          }
        }
        fetchStudents();
        fetchActiveCourses();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error initializing:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [navigate, language, permissionsData]);

  const fetchActiveCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('students_grades')
        .select('course_id')
        .eq('professor_id', session.user.id)
        .not('course_id', 'is', null);

      if (data) {
        const uniqueCourses = [...new Set(data.map(d => d.course_id).filter(Boolean))] as string[];
        setActiveCourses(uniqueCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
        return;
      }

      const { data, error } = await supabase
        .from('students_grades')
        .select('*')
        .eq('professor_id', session.user.id)
        .order('student_name', { ascending: true });

      if (error) throw error;
      setStudents((data || []).map((student: any) => ({
        ...student,
        rating: student.rating || 0
      })));
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error(language === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, field: string, value: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const updatedStudent = { ...student };
        const numericFields = ['quiz1', 'quiz2', 'midterm', 'final', 'rating'];
        
        if (numericFields.includes(field)) {
          const numValue = parseFloat(value) || 0;
          updatedStudent[field] = numValue;
          updatedStudent.sum = updatedStudent.quiz1 + updatedStudent.quiz2 + updatedStudent.midterm + updatedStudent.final + updatedStudent.rating;
        } else {
          updatedStudent[field] = value;
        }
        return updatedStudent;
      }
      return student;
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
        return;
      }

      const updates = filteredStudents.map(student => {
        const baseUpdate = {
        id: student.id,
        student_name: student.student_name,
        student_major: student.student_major,
        quiz1: student.quiz1,
        quiz2: student.quiz2,
        midterm: student.midterm,
        final: student.final,
        degree: student.degree,
        rating: student.rating,
        professor_id: session.user.id,
        course_id: student.course_id,
        };
        
        const customData = customColumns.reduce((acc, col) => ({
          ...acc,
          [col.key]: student[col.key]
        }), {});
        
        return { ...baseUpdate, ...customData };
      });

      const { error } = await supabase
        .from('students_grades')
        .upsert(updates);

      if (error) throw error;
      toast.success(language === "ar" ? "✅ تم حفظ التغييرات" : "✅ Changes saved");
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(language === "ar" ? "فشل حفظ التغييرات" : "Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.student_name.trim()) {
      toast.error(language === "ar" ? "الرجاء إدخال اسم الطالب" : "Please enter student name");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
        return;
      }

      const { error } = await supabase
        .from('students_grades')
        .insert({
          student_name: newStudent.student_name,
          student_major: newStudent.student_major,
          professor_id: session.user.id,
          quiz1: 0,
          quiz2: 0,
          midterm: 0,
          final: 0,
          rating: 0,
          degree: "",
          course_id: selectedCourse,
        });

      if (error) throw error;
      
      toast.success(language === "ar" ? "✅ تم إضافة الطالب" : "✅ Student added");
      setNewStudent({ student_name: "", student_major: "" });
      setIsAddDialogOpen(false);
      fetchStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(language === "ar" ? "فشل إضافة الطالب" : "Failed to add student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الطالب؟" : "Are you sure you want to delete this student?")) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students_grades')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      
      toast.success(language === "ar" ? "✅ تم حذف الطالب" : "✅ Student deleted");
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(language === "ar" ? "فشل حذف الطالب" : "Failed to delete student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/professor');
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === "ar" ? "حدث خطأ" : "Error occurred");
        return;
      }

      const studentsToImport = jsonData.map((row: any) => ({
        student_name: row['اسم الطالب'] || row['Student Name'] || '',
        student_major: row['التخصص'] || row['Major'] || '',
        professor_id: session.user.id,
        quiz1: 0,
        quiz2: 0,
        midterm: 0,
        final: 0,
        rating: 0,
        degree: "",
        course_id: selectedCourse,
      })).filter(s => s.student_name);

      const { error } = await supabase
        .from('students_grades')
        .insert(studentsToImport);

      if (error) throw error;
      
      toast.success(language === "ar" ? `✅ تم استيراد ${studentsToImport.length} طالب` : `✅ Imported ${studentsToImport.length} students`);
      fetchStudents();
    } catch (error: any) {
      console.error('Error importing:', error);
      toast.error(language === "ar" ? "فشل استيراد البيانات" : "Failed to import data");
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleExportAllToExcel = () => {
    if (students.length === 0) {
      toast.error(language === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
      return;
    }

    const dataToExport = students.map((student, index) => {
        const studentData: {[key: string]: any} = {
            'ID': index + 1,
            [language === "ar" ? 'اسم الطالب' : 'Student Name']: student.student_name,
            [language === "ar" ? 'التخصص' : 'Major']: student.student_major,
            'Quiz 1': student.quiz1 || 0,
            'Quiz 2': student.quiz2 || 0,
            'Midterm': student.midterm || 0,
            'Final': student.final || 0,
            [language === "ar" ? 'التقييم' : 'Rating']: student.rating || 0,
            'Sum': (student.quiz1 || 0) + (student.quiz2 || 0) + (student.midterm || 0) + (student.final || 0) + (student.rating || 0),
            'Degree': student.degree || '',
            [language === "ar" ? 'المادة' : 'Course']: student.course_id || (language === "ar" ? "رئيسية" : "Main"),
        };

        customColumns.forEach(col => {
            studentData[col.label] = student[col.key] || '';
        });

        return studentData;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Grades Backup");
    const fileName = `Grades_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success(language === "ar" ? "✅ تم تصدير النسخة الاحتياطية بنجاح" : "✅ Backup exported successfully");
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error(language === "ar" ? "الرجاء إدخال اسم المادة" : "Please enter course name");
      return;
    }

    // Check if course already exists
    if (activeCourses.includes(newCourseName)) {
      toast.error(language === "ar" ? "هذه المادة موجودة بالفعل" : "This course already exists");
      return;
    }

    setActiveCourses(prev => [...prev, newCourseName]);
    setSelectedCourse(newCourseName);
    setIsAddCourseDialogOpen(false);
    setNewCourseName("");
    toast.success(language === "ar" ? "✅ تم إضافة المادة" : "✅ Course added");
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع الطلاب المسجلين فيها." : "Are you sure you want to delete this course? All registered students will be deleted.")) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete all students in this course
      const { error } = await supabase
        .from('students_grades')
        .delete()
        .eq('professor_id', session.user.id)
        .eq('course_id', courseId);

      if (error) throw error;

      setActiveCourses(prev => prev.filter(c => c !== courseId));
      if (selectedCourse === courseId) {
        setSelectedCourse(null);
      }
      toast.success(language === "ar" ? "✅ تم حذف المادة" : "✅ Course deleted");
      fetchStudents();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(language === "ar" ? "فشل حذف المادة" : "Failed to delete course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomColumn = () => {
    if (!newColumnTitle.trim()) return;
    const key = newColumnTitle.toLowerCase().replace(/\s+/g, '_');
    
    if (customColumns.some(c => c.key === key)) {
      toast.error(language === "ar" ? "هذا العمود موجود بالفعل" : "Column already exists");
      return;
    }

    setCustomColumns([...customColumns, { key, label: newColumnTitle }]);
    setNewColumnTitle("");
    toast.success(language === "ar" ? "تم إضافة العمود" : "Column added");
  };

  const availableColumns = [
    { key: 'quiz1', label: 'Quiz 1' },
    { key: 'quiz2', label: 'Quiz 2' },
    { key: 'midterm', label: 'Midterm' },
    { key: 'final', label: 'Final' },
    { key: 'rating', label: language === "ar" ? "التقييم" : "Rating" },
    { key: 'sum', label: 'Sum' },
    { key: 'degree', label: 'Degree' },
  ].filter(col => !visibleColumns[col.key as keyof typeof visibleColumns]);

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
          <source src="M.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative z-10">
        <NavigationBar language={language} permissions={permissions} />
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold">
            {language === "ar" ? "إدارة درجات الطلاب" : "Students Grades Management"}
            {selectedCourse && (
              <span className="text-xl text-primary ml-2">
                ({selectedCourse})
              </span>
            )}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")} variant="outline">
              {language === "ar" ? "EN" : "AR"}
            </Button>
            <Button onClick={handleClose} variant="outline" size="icon">
              <X />
            </Button>
          </div>
        </div>

        {/* Course Tabs */}
        <Card className="p-4 shadow-xl border-white/10 bg-black/30">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={selectedCourse === null ? "default" : "outline"}
              onClick={() => setSelectedCourse(null)}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {language === "ar" ? "الرئيسية" : "Main"}
            </Button>
            
            {activeCourses.map(courseId => (
              <div key={courseId} className="flex items-center gap-1">
                <Button
                  variant={selectedCourse === courseId ? "default" : "outline"}
                  onClick={() => setSelectedCourse(courseId)}
                >
                  {courseId}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                  onClick={() => handleDeleteCourse(courseId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إضافة مادة" : "Add Course"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "ar" ? "إضافة مادة جديدة" : "Add New Course"}</DialogTitle>
                  <DialogDescription>
                    {language === "ar" ? "أدخل اسم المادة الجديدة" : "Enter the new course name"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder={language === "ar" ? "اسم المادة" : "Course name"}
                  />
                  <Button onClick={handleAddCourse} className="w-full" disabled={!newCourseName.trim()}>
                    {language === "ar" ? "إضافة" : "Add"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Search and Controls */}
        <div className="flex gap-4 flex-wrap items-center">
          <Input
            placeholder={language === "ar" ? "بحث برقم ID" : "Search by ID"}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full sm:w-48"
            dir={language === "ar" ? "rtl" : "ltr"}
          />
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "إضافة عمود" : "Add Column"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "ar" ? "إضافة عمود" : "Add Column"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder={language === "ar" ? "اسم العمود الجديد" : "New Column Name"}
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                    />
                    <Button onClick={handleAddCustomColumn} className="shadow-md hover:shadow-lg transition-all">
                      {language === "ar" ? "إضافة" : "Add"}
                    </Button>
                  </div>
                  
                  {availableColumns.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 border-t pt-4">
                    {availableColumns.map(col => (
                      <Button 
                        key={col.key} 
                        variant="outline" 
                        className="shadow-sm hover:shadow-md transition-all"
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [col.key]: true }))}
                      >
                        {col.label}
                      </Button>
                    ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                <Plus className="mr-2" />
                {language === "ar" ? "إضافة طالب جديد" : "Add New Student"}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "إضافة طالب جديد" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={language === "ar" ? "اسم الطالب" : "Student Name"}
                value={newStudent.student_name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, student_name: e.target.value }))}
                dir={language === "ar" ? "rtl" : "ltr"}
              />
              <Input
                placeholder={language === "ar" ? "التخصص" : "Major"}
                value={newStudent.student_major}
                onChange={(e) => setNewStudent(prev => ({ ...prev, student_major: e.target.value }))}
                dir={language === "ar" ? "rtl" : "ltr"}
              />
              <Button onClick={handleAddStudent} className="w-full shadow-md hover:shadow-lg transition-all">
                {language === "ar" ? "إضافة" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => document.getElementById('excel-import')?.click()}
          variant="outline"
          disabled={isLoading}
          className="shadow-sm hover:shadow-md transition-all"
        >
          <Upload className="mr-2" />
          {language === "ar" ? "استيراد من Excel" : "Import from Excel"}
        </Button>
        <input
          id="excel-import"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />

        <Button
          onClick={handleExportAllToExcel}
          variant="outline"
          disabled={students.length === 0}
          className="shadow-sm hover:shadow-md transition-all"
        >
          <FileSpreadsheet className="mr-2" />
          {language === "ar" ? "نسخة احتياطية (Excel)" : "Backup (Excel)"}
        </Button>

        <Button
          onClick={() => setIsWordExportOpen(true)}
          variant="outline"
          disabled={filteredStudents.length === 0}
          className="shadow-sm hover:shadow-md transition-all"
        >
          <FileDown className="mr-2" />
          {language === "ar" ? "تصدير Word" : "Export Word"}
        </Button>
      </div>

      <WordExportDialog
        open={isWordExportOpen}
        onOpenChange={setIsWordExportOpen}
        students={filteredStudents}
        language={language}
      />

        {/* Grades Table */}
        <Card className="p-4 md:p-6 w-full shadow-xl border-white/10 bg-black/30">
          {isLoading && filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </p>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {language === "ar" ? "لا يوجد طلاب مسجلين في هذه المادة" : "No students registered in this course"}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-4 w-4" />
                {language === "ar" ? "إضافة طالب" : "Add Student"}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{language === "ar" ? "اسم الطالب" : "Student Name"}</TableHead>
                      <TableHead>{language === "ar" ? "التخصص" : "Major"}</TableHead>
                      {visibleColumns.quiz1 && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Quiz 1
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, quiz1: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.quiz2 && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Quiz 2
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, quiz2: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.midterm && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Midterm
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, midterm: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.final && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Final
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, final: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.rating && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          {language === "ar" ? "التقييم" : "Rating"}
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, rating: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.sum && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Sum
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, sum: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.degree && (
                        <TableHead className="text-center relative group min-w-[100px]">
                          Degree
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(prev => ({ ...prev, degree: false }))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      )}
                      {customColumns.map(col => (
                        <TableHead key={col.key} className="text-center relative group min-w-[100px]">
                          {col.label}
                          <button
                            type="button"
                            onClick={() => setCustomColumns(prev => prev.filter(c => c.key !== col.key))}
                            className="absolute top-2 right-1 opacity-50 hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-all z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.student_major}</TableCell>
                        {visibleColumns.quiz1 && (
                          <TableCell>
                            <Input
                              type="number"
                              value={student.quiz1 || ""}
                              placeholder="0"
                              onChange={(e) => handleGradeChange(student.id, 'quiz1', e.target.value)}
                              className="w-20 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.quiz2 && (
                          <TableCell>
                            <Input
                              type="number"
                              value={student.quiz2 || ""}
                              placeholder="0"
                              onChange={(e) => handleGradeChange(student.id, 'quiz2', e.target.value)}
                              className="w-20 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.midterm && (
                          <TableCell>
                            <Input
                              type="number"
                              value={student.midterm || ""}
                              placeholder="0"
                              onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)}
                              className="w-20 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.final && (
                          <TableCell>
                            <Input
                              type="number"
                              value={student.final || ""}
                              placeholder="0"
                              onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)}
                              className="w-20 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.rating && (
                          <TableCell>
                            <Input
                              type="number"
                              value={student.rating || ""}
                              placeholder="0"
                              onChange={(e) => handleGradeChange(student.id, 'rating', e.target.value)}
                              className="w-20 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        )}
                        {visibleColumns.sum && (
                          <TableCell className="text-center font-bold">
                            {(student.quiz1 + student.quiz2 + student.midterm + student.final + student.rating).toFixed(2)}
                          </TableCell>
                        )}
                        {visibleColumns.degree && (
                          <TableCell>
                            <Input
                              type="text"
                              value={student.degree || ""}
                              onChange={(e) => handleGradeChange(student.id, 'degree', e.target.value)}
                              className="w-24 text-center"
                              placeholder={language === "ar" ? "التقدير" : "Grade"}
                            />
                          </TableCell>
                        )}
                        {customColumns.map(col => (
                          <TableCell key={col.key}>
                            <Input
                              value={student[col.key] || ""}
                              onChange={(e) => handleGradeChange(student.id, col.key, e.target.value)}
                              className="w-20 text-center"
                              placeholder="-"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="mr-2" />
                  {language === "ar" ? "السابق" : "Previous"}
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {language === "ar" 
                    ? `صفحة ${currentPage} من ${totalPages || 1}` 
                    : `Page ${currentPage} of ${totalPages || 1}`}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  {language === "ar" ? "التالي" : "Next"}
                  <ChevronLeft className="ml-2" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="flex-1 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <Save className="mr-2" />
                  {language === "ar" ? "حفظ" : "Save"}
                </Button>
                <Button 
                  onClick={handleClose} 
                  variant="outline"
                  className="flex-1 shadow-sm hover:shadow-md transition-all"
                >
                  <X className="mr-2" />
                  {language === "ar" ? "إغلاق" : "Close"}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
      </div>
    </div>
  );
};

export default GradesManager;
