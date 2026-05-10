import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

export const importStudentsFromFile = async () => {
  try {
    const response = await fetch('/data/students_data.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No session found");
    }

    const studentsToImport = jsonData.map((row: any) => ({
      student_name: row['اسم الطالب'] || '',
      student_major: 'تكنولوجيا علوم البيانات',
      professor_id: session.user.id,
      quiz1: 0,
      quiz2: 0,
      midterm: 0,
      final: 0,
      rating: 0,
      degree: "",
    })).filter(s => s.student_name);

    // Delete existing students for this professor
    await supabase
      .from('students_grades')
      .delete()
      .eq('professor_id', session.user.id);

    // Insert new students
    const { error } = await supabase
      .from('students_grades')
      .insert(studentsToImport);

    if (error) throw error;
    
    return { success: true, count: studentsToImport.length };
  } catch (error) {
    console.error('Error importing students:', error);
    throw error;
  }
};
