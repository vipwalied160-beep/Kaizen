import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  UserPlus,
  Trash2,
  Copy,
  Users,
  LogOut,
  Search,
  Settings,
  CheckCircle,
  XCircle,
  BarChart3,
  GraduationCap,
  Video,
  FileText,
  ClipboardList,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useCallback, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface ProfessorPermissions {
  attendance: boolean;
  grades: boolean;
  exams: boolean;
  meetings: boolean;
  courses: boolean;
}

interface ProfessorCode {
  id: string;
  professor_id: string;
  professor_name: string;
  professor_email: string;
  unique_code: string;
  created_at: string;
  permissions: ProfessorPermissions;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Professor creation
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProfessor, setNewProfessor] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Professors list
  const [professors, setProfessors] = useState<ProfessorCode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Permissions dialog
  const [selectedProfessor, setSelectedProfessor] =
    useState<ProfessorCode | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      // We use sessionStorage to persist the simple password-based auth
      // This is not secure for production but matches the request.
      if (sessionStorage.getItem("admin_authenticated") === "true") {
        setIsAuthenticated(true);
      }
    };
    checkAdminAuth();
  }, []);

  // Fetch professors when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfessors();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = useCallback(() => {
    if (!adminPassword.trim()) {
      toast.error(
        language === "ar"
          ? "الرجاء إدخال كلمة السر"
          : "Please enter the password"
      );
      return;
    }

    setIsLoading(true);
    // Simple password check as requested
    setTimeout(() => {
      if (adminPassword === "Walied 2004") {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true"); // Persist session
        toast.success(
          language === "ar" ? "تم تسجيل الدخول كمدير" : "Logged in as Admin"
        );
      } else {
        toast.error(
          language === "ar" ? "كلمة السر غير صحيحة" : "Incorrect password"
        );
      }
      setIsLoading(false);
    }, 500);
  }, [adminPassword, language]);

  const fetchProfessors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professor_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching professors:", error);
        return;
      }

      const processedData = (data || []).map((prof) => ({
        ...prof,
        permissions: (prof.permissions as unknown as ProfessorPermissions) || {
          attendance: true,
          grades: true,
          exams: true,
          meetings: true,
          courses: true,
        },
      }));

      setProfessors(processedData);
    } catch (err) {
      console.error("Error:", err);
    }
  }, []);

  const generateUniqueCode = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PROF-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const handleCreateProfessor = useCallback(async () => {
    if (
      !newProfessor.name.trim() ||
      !newProfessor.email.trim() ||
      !newProfessor.password.trim()
    ) {
      toast.error(
        language === "ar" ? "الرجاء ملء جميع الحقول" : "Please fill all fields"
      );
      return;
    }

    if (newProfessor.password.length < 6) {
      toast.error(
        language === "ar"
          ? "كلمة السر يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Create user account with professor role
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: newProfessor.email,
          password: newProfessor.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: newProfessor.name,
              role: "professor",
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error("Failed to create user");
      }

      const uniqueCode = generateUniqueCode();

      // Insert professor code with default permissions
      const { error: codeError } = await supabase
        .from("professor_codes")
        .insert({
          professor_id: signUpData.user.id,
          professor_name: newProfessor.name,
          professor_email: newProfessor.email,
          unique_code: uniqueCode,
          created_by: signUpData.user.id,
          permissions: JSON.parse(
            JSON.stringify({
              attendance: true,
              grades: true,
              exams: true,
              meetings: true,
              courses: true,
            })
          ),
        });

      if (codeError) throw codeError;

      toast.success(
        language === "ar"
          ? `✅ تم إنشاء حساب الدكتور بنجاح\nالكود: ${uniqueCode}`
          : `✅ Professor account created\nCode: ${uniqueCode}`,
        { duration: 5000 }
      );

      setNewProfessor({ name: "", email: "", password: "" });
      setIsCreateDialogOpen(false);
      fetchProfessors();
    } catch (error: any) {
      console.error("Error creating professor:", error);
      if (error.message?.includes("already registered")) {
        toast.error(
          language === "ar"
            ? "البريد الإلكتروني مسجل بالفعل"
            : "Email already registered"
        );
      } else {
        toast.error(
          error.message ||
            (language === "ar"
              ? "فشل إنشاء الحساب"
              : "Failed to create account")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [newProfessor, language, generateUniqueCode, fetchProfessors]);

  const handleDeleteProfessor = useCallback(
    async (professor: ProfessorCode) => {
      if (
        !confirm(
          language === "ar"
            ? `هل تريد حذف ${professor.professor_name}؟`
            : `Delete ${professor.professor_name}?`
        )
      ) {
        return;
      }

      try {
        // Delete professor code first
        const { error } = await supabase
          .from("professor_codes")
          .delete()
          .eq("id", professor.id);

        if (error) throw error;

        // Try to delete auth user if session exists (Best effort to clean up Auth)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ userId: professor.professor_id }),
              }
            );
          } catch (e) {
            console.error("Failed to delete auth user:", e);
          }
        }

        toast.success(
          language === "ar" ? "✅ تم حذف الدكتور" : "✅ Professor deleted"
        );
        fetchProfessors();
      } catch (error: any) {
        console.error("Error deleting professor:", error);
        toast.error(
          language === "ar" ? "فشل حذف الدكتور" : "Failed to delete professor"
        );
      }
    },
    [language, fetchProfessors]
  );

  const handleCopy = useCallback(
    async (text: string, type: "code" | "email") => {
      const label = type === "code" ? (language === "ar" ? "الكود" : "Code") : (language === "ar" ? "البريد" : "Email");
      try {
        await navigator.clipboard.writeText(text);
        toast.success(language === "ar" ? `✅ تم نسخ ${label}` : `✅ ${label} copied`);
      } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success(language === "ar" ? `✅ تم نسخ ${label}` : `✅ ${label} copied`);
        } catch (e) {
          toast.error(language === "ar" ? "فشل النسخ" : "Failed to copy");
        }
        document.body.removeChild(textArea);
      }
    },
    [language]
  );

  const handleUpdatePermissions = useCallback(
    async (professorId: string, permissions: ProfessorPermissions) => {
      try {
        const { error } = await supabase
          .from("professor_codes")
          .update({
            permissions: permissions as unknown as Record<string, boolean>,
          })
          .eq("id", professorId);

        if (error) throw error;

        toast.success(
          language === "ar" ? "✅ تم تحديث الصلاحيات" : "✅ Permissions updated"
        );
        fetchProfessors();
        setIsPermissionsDialogOpen(false);
      } catch (error) {
        console.error("Error updating permissions:", error);
        toast.error(
          language === "ar"
            ? "فشل تحديث الصلاحيات"
            : "Failed to update permissions"
        );
      }
    },
    [language, fetchProfessors]
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    navigate("/");
  }, [navigate]);

  // Memoized filtered professors
  const filteredProfessors = useMemo(() => {
    if (!searchQuery.trim()) return professors;
    const query = searchQuery.toLowerCase();
    return professors.filter(
      (prof) =>
        prof.professor_name.toLowerCase().includes(query) ||
        prof.unique_code.toLowerCase().includes(query) ||
        prof.professor_email.toLowerCase().includes(query)
    );
  }, [professors, searchQuery]);

  const permissionLabels = useMemo(
    () => ({
      attendance: { ar: "الحضور", en: "Attendance", icon: ClipboardList },
      grades: { ar: "الدرجات", en: "Grades", icon: BarChart3 },
      exams: { ar: "الامتحانات", en: "Exams", icon: FileText },
      meetings: { ar: "الاجتماعات", en: "Meetings", icon: Video },
      courses: { ar: "المقررات", en: "Courses", icon: GraduationCap },
    }),
    []
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* ⬇️⬇️ كود الفيديو هنا (شاشة تسجيل الدخول) ⬇️⬇️ */}
        <div className="fixed inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="M.mp4" type="video/mp4" />
          </video>
        </div>
        {/* ⬆️⬆️ نهاية كود الفيديو ⬆️⬆️ */}
        <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border-2 relative z-10 bg-white/5 border-white/10">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Shield className="text-blue-600" size={100} />
            </div>
            <h2 className="text-5xl font-extrabold text-white">
              {language === "ar" ? "لوحة تحكم المدير" : "Admin Dashboard"}
            </h2>
            <p className="text-white text-2xl font-extrabold">
              {language === "ar"
                ? "أدخل بيانات حساب الأدمن"
                : "Enter admin credentials"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xl font-bold">{language === "ar" ? "كلمة السر" : "Password"}</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="••••••••"
                className="mt-1 h-14 text-xl font-bold"
                dir="ltr"
              />
            </div>
            <Button
              onClick={handleAdminLogin}
              className="w-full h-16 text-2xl font-extrabold shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading
                ? language === "ar"
                  ? "جاري الدخول..."
                  : "Logging in..."
                : language === "ar"
                ? "دخول"
                : "Login"}
            </Button>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => navigate("/")}>
              {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setLanguage((prev) => (prev === "ar" ? "en" : "ar"))
              }
            >
              {language === "ar" ? "EN" : "AR"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      {/* ⬇️⬇️ كود الفيديو هنا (لوحة التحكم) ⬇️⬇️ */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="M.mp4" type="video/mp4" />
        </video>
      </div>
      {/* ⬆️⬆️ نهاية كود الفيديو ⬆️⬆️ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold text-white">
                {language === "ar" ? "لوحة تحكم المدير" : "Admin Dashboard"}
              </h1>
              <p className="text-white text-xl font-extrabold">
                {language === "ar"
                  ? "إدارة حسابات الدكاترة والصلاحيات"
                  : "Manage professor accounts & permissions"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setLanguage((prev) => (prev === "ar" ? "en" : "ar"))
              }
              className=""
            >
              {language === "ar" ? "EN" : "AR"}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {language === "ar" ? "خروج" : "Logout"}
            </Button>
          </div>
        </div>

        {/* Stats Card - Only Professors Count */}
        <Card className="p-6 shadow-xl border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-5xl font-extrabold text-white">
                {professors.length}
              </p>
              <p className="text-white text-xl font-extrabold">
                {language === "ar"
                  ? "عدد الدكاترة المسجلين"
                  : "Total Registered Professors"}
              </p>
            </div>
          </div>
        </Card>

        {/* Search and Add */}
        <Card className="p-4 shadow-lg border-white/10 bg-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
              <Input
                placeholder={
                  language === "ar"
                    ? "بحث بالاسم أو الكود أو البريد..."
                    : "Search by name, code, or email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-14 text-lg font-bold"
              />
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="shadow-md hover:shadow-lg transition-all h-14 text-lg font-bold"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {language === "ar" ? "إضافة دكتور جديد" : "Add New Professor"}
            </Button>
          </div>
        </Card>

        {/* Professors Table */}
        <Card className="p-4 shadow-xl border-white/10 bg-white/5">
          <h3 className="text-3xl font-extrabold mb-6 flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            {language === "ar"
              ? "الدكاترة المسجلين"
              : "Registered Professors"}{" "}
            ({filteredProfessors.length})
          </h3>

          {filteredProfessors.length === 0 ? (
            <p className="text-center text-white text-xl font-extrabold py-8">
              {searchQuery
                ? language === "ar"
                  ? "لا توجد نتائج"
                  : "No results found"
                : language === "ar"
                ? "لا يوجد دكاترة مسجلين"
                : "No professors registered"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "الاسم" : "Name"}
                    </TableHead>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "البريد الإلكتروني" : "Email"}
                    </TableHead>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "الكود" : "Code"}
                    </TableHead>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "الصلاحيات" : "Permissions"}
                    </TableHead>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "تاريخ الإنشاء" : "Created"}
                    </TableHead>
                    <TableHead className="text-white text-xl font-extrabold">
                      {language === "ar" ? "إجراءات" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessors.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell className="text-lg font-bold text-white">
                        {professor.professor_name}
                      </TableCell>
                      <TableCell className="text-lg font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{professor.professor_email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(professor.professor_email, "email")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-lg font-bold font-mono text-white">
                            {professor.unique_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(professor.unique_code, "code")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(professor.permissions).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant={value ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {value ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {permissionLabels[
                                  key as keyof typeof permissionLabels
                                ]?.[language] || key}
                              </Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white text-lg font-bold">
                        {new Date(professor.created_at).toLocaleDateString(
                          language === "ar" ? "ar-EG" : "en-US"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProfessor(professor);
                              setIsPermissionsDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProfessor(professor)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Professor Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {language === "ar" ? "إضافة دكتور جديد" : "Add New Professor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
              <Input
                value={newProfessor.name}
                onChange={(e) =>
                  setNewProfessor((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={
                  language === "ar" ? "د. محمد أحمد" : "Dr. John Doe"
                }
              />
            </div>
            <div>
              <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                type="email"
                value={newProfessor.email}
                onChange={(e) =>
                  setNewProfessor((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="professor@university.edu"
                dir="ltr"
              />
            </div>
            <div>
              <Label>{language === "ar" ? "كلمة السر" : "Password"}</Label>
              <Input
                type="password"
                value={newProfessor.password}
                onChange={(e) =>
                  setNewProfessor((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            <Button
              onClick={handleCreateProfessor}
              className="w-full bg-gradient-to-r from-primary to-purple-600"
              disabled={isLoading}
            >
              {isLoading
                ? language === "ar"
                  ? "جاري الإنشاء..."
                  : "Creating..."
                : language === "ar"
                ? "إنشاء الحساب"
                : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {language === "ar" ? "صلاحيات" : "Permissions"} -{" "}
              {selectedProfessor?.professor_name}
            </DialogTitle>
          </DialogHeader>
          {selectedProfessor && (
            <div className="space-y-4">
              {Object.entries(selectedProfessor.permissions).map(
                ([key, value]) => {
                  const Icon =
                    permissionLabels[key as keyof typeof permissionLabels]
                      ?.icon || Settings;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          {permissionLabels[
                            key as keyof typeof permissionLabels
                          ]?.[language] || key}
                        </span>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => {
                          setSelectedProfessor((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    [key]: checked,
                                  },
                                }
                              : null
                          );
                        }}
                      />
                    </div>
                  );
                }
              )}
              <Button
                onClick={() =>
                  selectedProfessor &&
                  handleUpdatePermissions(
                    selectedProfessor.id,
                    selectedProfessor.permissions
                  )
                }
                className="w-full"
              >
                {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
