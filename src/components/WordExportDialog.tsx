import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Eye } from "lucide-react";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface StudentGrade {
  id: string;
  student_name: string;
  student_major: string | null;
  quiz1: number;
  quiz2: number;
  midterm: number;
  final: number;
  rating: number;
  sum: number | null;
  degree: string | null;
}

interface WordExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentGrade[];
  language: "ar" | "en";
}

export const WordExportDialog = ({ open, onOpenChange, students, language }: WordExportDialogProps) => {
  const [header, setHeader] = useState(language === "ar" ? "تقرير درجات الطلاب" : "Student Grades Report");
  const [footer, setFooter] = useState(language === "ar" ? "جامعة - كلية الحاسبات والمعلومات" : "University - Faculty of Computers and Information");
  const [showPreview, setShowPreview] = useState(false);
  
  const [selectedColumns, setSelectedColumns] = useState({
    student_name: true,
    student_major: true,
    quiz1: true,
    quiz2: true,
    midterm: true,
    final: true,
    rating: true,
    sum: true,
    degree: true
  });

  const columnLabels = {
    student_name: language === "ar" ? "اسم الطالب" : "Student Name",
    student_major: language === "ar" ? "التخصص" : "Major",
    quiz1: language === "ar" ? "الاختبار 1" : "Quiz 1",
    quiz2: language === "ar" ? "الاختبار 2" : "Quiz 2",
    midterm: language === "ar" ? "منتصف الفصل" : "Midterm",
    final: language === "ar" ? "النهائي" : "Final",
    rating: language === "ar" ? "التقييم" : "Rating",
    sum: language === "ar" ? "المجموع" : "Sum",
    degree: language === "ar" ? "الدرجة" : "Degree"
  };

  const handleColumnToggle = (column: keyof typeof selectedColumns) => {
    setSelectedColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const generateDocument = async () => {
    const headerCells = Object.entries(selectedColumns)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => 
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: columnLabels[key as keyof typeof columnLabels], bold: true })],
            alignment: AlignmentType.CENTER
          })],
          width: { size: 100 / Object.values(selectedColumns).filter(Boolean).length, type: WidthType.PERCENTAGE }
        })
      );

    const dataRows = students.map(student => 
      new TableRow({
        children: Object.entries(selectedColumns)
          .filter(([_, isSelected]) => isSelected)
          .map(([key]) => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: String(student[key as keyof StudentGrade] || "") })],
                alignment: AlignmentType.CENTER
              })],
            })
          )
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: header,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Table({
            rows: [
              new TableRow({ children: headerCells }),
              ...dataRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),
          new Paragraph({
            text: "",
            spacing: { before: 400 }
          }),
          new Paragraph({
            text: footer,
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    return doc;
  };

  const handleExport = async () => {
    const doc = await generateDocument();
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `grades-report-${new Date().getTime()}.docx`);
    onOpenChange(false);
  };

  const PreviewContent = () => (
    <div className="border rounded-lg p-6 bg-white text-black">
      <h1 className="text-2xl font-bold text-center mb-6">{header}</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {Object.entries(selectedColumns)
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => (
                  <th key={key} className="border border-gray-300 p-2 text-center font-bold">
                    {columnLabels[key as keyof typeof columnLabels]}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 5).map((student) => (
              <tr key={student.id}>
                {Object.entries(selectedColumns)
                  .filter(([_, isSelected]) => isSelected)
                  .map(([key]) => (
                    <td key={key} className="border border-gray-300 p-2 text-center">
                      {String(student[key as keyof StudentGrade] || "")}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
        {students.length > 5 && (
          <p className="text-center text-gray-500 mt-2">
            {language === "ar" ? `... و ${students.length - 5} طالب آخر` : `... and ${students.length - 5} more students`}
          </p>
        )}
      </div>
      <p className="text-center mt-6 text-gray-600">{footer}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "ar" ? "تصدير تقرير Word" : "Export Word Report"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "عنوان التقرير" : "Report Header"}</Label>
              <Input
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder={language === "ar" ? "أدخل عنوان التقرير" : "Enter report header"}
              />
            </div>

            <div>
              <Label>{language === "ar" ? "تذييل التقرير" : "Report Footer"}</Label>
              <Textarea
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder={language === "ar" ? "أدخل تذييل التقرير" : "Enter report footer"}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === "ar" ? "اختر الأعمدة للتصدير" : "Select Columns to Export"}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(selectedColumns).map(([key, isSelected]) => (
                <div key={key} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={key}
                    checked={isSelected}
                    onCheckedChange={() => handleColumnToggle(key as keyof typeof selectedColumns)}
                  />
                  <Label htmlFor={key} className="cursor-pointer">
                    {columnLabels[key as keyof typeof columnLabels]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {showPreview && (
            <div className="space-y-2">
              <Label>{language === "ar" ? "معاينة التقرير" : "Report Preview"}</Label>
              <PreviewContent />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2" size={18} />
            {showPreview 
              ? (language === "ar" ? "إخفاء المعاينة" : "Hide Preview")
              : (language === "ar" ? "معاينة" : "Preview")}
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2" size={18} />
            {language === "ar" ? "تصدير" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
