import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Student from "./pages/Student";
import Professor from "./pages/Professor";
import GradesManager from "./pages/GradesManager";
import StudentReport from "./pages/StudentReport";
import CourseManagement from "./pages/CourseManagement";
import Meetings from "./pages/Meetings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/student" element={<Student />} />
          <Route path="/professor" element={<Professor />} />
          <Route path="/grades" element={<GradesManager />} />
          <Route path="/student-report" element={<StudentReport />} />
          <Route path="/course/:courseId" element={<CourseManagement />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
