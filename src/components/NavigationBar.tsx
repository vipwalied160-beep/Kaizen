import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, FileSpreadsheet, Video, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfessorPermissions {
  attendance: boolean;
  grades: boolean;
  exams: boolean;
  meetings: boolean;
  courses: boolean;
}

interface NavigationBarProps {
  language?: "ar" | "en";
  permissions?: ProfessorPermissions;
  showAdminLink?: boolean;
}

export const NavigationBar = ({ language = "ar", permissions, showAdminLink = false }: NavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('professor_authenticated');
    toast.success(language === "ar" ? "تم تسجيل الخروج" : "Logged out");
    navigate("/");
  };

  // Base nav items
  const allNavItems = [
    {
      path: "/professor",
      icon: Home,
      label: language === "ar" ? "الغياب" : "Attendance",
      permissionKey: "attendance" as const,
      alwaysShow: true,
    },
    {
      path: "/grades",
      icon: FileSpreadsheet,
      label: language === "ar" ? "إدارة الدرجات" : "Grades Manager",
      permissionKey: "grades" as const,
      alwaysShow: false,
    },
    {
      path: "/meetings",
      icon: Video,
      label: language === "ar" ? "الاجتماعات" : "Meetings",
      permissionKey: "meetings" as const,
      alwaysShow: false,
    },
    {
      path: "/admin",
      icon: Shield,
      label: language === "ar" ? "لوحة التحكم" : "Admin Panel",
      permissionKey: "courses" as const, // Admin controlled by admin
      alwaysShow: false,
      isAdmin: true,
    },
  ];

  // Filter based on permissions
  const navItems = allNavItems.filter(item => {
    // Hide admin link unless explicitly shown
    if ((item as any).isAdmin && !showAdminLink) return false;
    if (item.alwaysShow) return true;
    if (!permissions) return true;
    return permissions[item.permissionKey];
  });

  return (
    <nav className="bg-card/50 border-b border-primary/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 flex-wrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`${isActive ? "bg-primary text-primary-foreground" : ""} text-sm`}
                  size="sm"
                >
                  <Icon size={18} className="mr-1" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-destructive text-destructive hover:bg-destructive/10"
            size="sm"
          >
            <LogOut size={18} className="mr-1" />
            {language === "ar" ? "خروج" : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  );
};
