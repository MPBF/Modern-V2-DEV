import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { canEditInArea } from "../../utils/roleUtils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";

const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import {
  Calendar as CalendarIcon,
  Save,
  Printer,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileEdit,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ar } from "date-fns/locale";

interface AttendanceRecord {
  date: string;
  dayName: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  notes: string | null;
  attendance_id: number | null;
}

interface ModifiedRecord {
  date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string;
}

interface EmployeeMonthlyData {
  employee: {
    id: number;
    name: string;
    employeeNumber: string;
    department: string;
    position: string;
  };
  records: AttendanceRecord[];
  summary: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    lateDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
  };
}

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const statusOptions = [
  {
    value: "حاضر",
    labelKey: "hr.monthlyEditor.statusPresent",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "غائب",
    labelKey: "hr.monthlyEditor.statusAbsent",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "إجازة",
    labelKey: "hr.monthlyEditor.statusLeave",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "مغادر",
    labelKey: "hr.monthlyEditor.statusEarlyLeave",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "متأخر",
    labelKey: "hr.monthlyEditor.statusLate",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "عطلة",
    labelKey: "hr.monthlyEditor.statusHoliday",
    color: "bg-purple-100 text-purple-800",
  },
];

export default function MonthlyAttendanceEditor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEditHr = canEditInArea(user, "hr");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [modifiedRecords, setModifiedRecords] = useState<
    Map<string, ModifiedRecord>
  >(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  const { data: usersData, isLoading: usersLoading } = useQuery<
    any[] | { data: any[] }
  >({
    queryKey: ["/api/users"],
  });

  const monthStart = format(selectedMonth, "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch,
  } = useQuery<{ success: boolean; data: EmployeeMonthlyData }>({
    queryKey: [
      "/api/attendance/monthly-editor",
      selectedEmployeeId,
      monthStart,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/attendance/monthly-editor/${selectedEmployeeId}?startDate=${monthStart}&endDate=${monthEnd}`,
      );
      if (!response.ok) throw new Error(t("hr.monthlyEditor.fetchError"));
      return response.json();
    },
    enabled: !!selectedEmployeeId,
  });

  const saveMutation = useMutation({
    mutationFn: async (records: ModifiedRecord[]) => {
      const response = await apiRequest("/api/attendance/monthly-editor/save", {
        method: "POST",
        body: JSON.stringify({
          userId: parseInt(selectedEmployeeId),
          records,
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/attendance/monthly-editor"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setModifiedRecords(new Map());
      setHasChanges(false);
      toast({
        title: t("hr.monthlyEditor.saveSuccess"),
        description:
          data.message ||
          t("hr.monthlyEditor.savedRecords", { count: data.savedCount || 0 }),
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t("hr.monthlyEditor.saveError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
    setModifiedRecords(new Map());
    setHasChanges(false);
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
    setModifiedRecords(new Map());
    setHasChanges(false);
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployeeId(value);
    setModifiedRecords(new Map());
    setHasChanges(false);
  };

  const getRecordValue = (
    date: string,
    field: keyof ModifiedRecord,
    originalValue: any,
  ) => {
    const modified = modifiedRecords.get(date);
    if (modified && field in modified) {
      return modified[field];
    }
    return originalValue;
  };

  const handleFieldChange = (
    date: string,
    field: keyof ModifiedRecord,
    value: any,
    originalRecord: AttendanceRecord,
  ) => {
    const newModified = new Map(modifiedRecords);
    const existing = newModified.get(date) || {
      date,
      status: originalRecord.status || "غائب",
      check_in_time: originalRecord.check_in_time,
      check_out_time: originalRecord.check_out_time,
      notes: originalRecord.notes || "",
    };

    (existing as any)[field] = value;
    newModified.set(date, existing);
    setModifiedRecords(newModified);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (modifiedRecords.size === 0) {
      toast({ title: t("hr.monthlyEditor.noChanges"), variant: "destructive" });
      return;
    }
    saveMutation.mutate(Array.from(modifiedRecords.values()));
  };

  const handlePrint = () => {
    if (!printRef.current || !attendanceData?.data) return;

    const employee = attendanceData.data.employee;
    const records = attendanceData.data.records;
    const summary = attendanceData.data.summary;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: t("hr.monthlyEditor.printError"),
        variant: "destructive",
      });
      return;
    }

    const recordRows = records
      .map((record) => {
        const modifiedRecord = modifiedRecords.get(record.date);
        const status =
          escapeHtml(modifiedRecord?.status || record.status) || "-";
        const checkIn =
          escapeHtml(modifiedRecord?.check_in_time || record.check_in_time) ||
          "-";
        const checkOut =
          escapeHtml(modifiedRecord?.check_out_time || record.check_out_time) ||
          "-";
        const notes = escapeHtml(modifiedRecord?.notes || record.notes) || "";
        const statusClass =
          status === "حاضر"
            ? "present"
            : status === "غائب"
              ? "absent"
              : "other";

        return `
        <tr>
          <td>${format(new Date(record.date), "dd/MM/yyyy")}</td>
          <td>${escapeHtml(record.dayName)}</td>
          <td class="status-${statusClass}">${status}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${record.work_hours ? record.work_hours.toFixed(1) : "-"}</td>
          <td>${notes}</td>
        </tr>
      `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${t("hr.monthlyEditor.printTitle")} - ${escapeHtml(employee.name)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { 
            size: A4 portrait; 
            margin: 8mm; 
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            padding: 5px; 
            direction: rtl;
            font-size: 9px;
            line-height: 1.2;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 5px; 
            margin-bottom: 8px;
          }
          .header h1 { color: #1e40af; font-size: 16px; margin-bottom: 2px; }
          .header p { color: #6b7280; font-size: 11px; }
          .employee-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5px;
            margin-bottom: 8px;
            padding: 6px;
            background: #f8fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .employee-info div { text-align: center; }
          .employee-info strong { display: block; color: #374151; font-size: 8px; }
          .employee-info span { font-size: 10px; font-weight: 600; color: #1f2937; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 5px;
            font-size: 8px;
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 2px 3px; 
            text-align: center; 
          }
          th { 
            background: #2563eb; 
            color: white; 
            font-weight: 600;
            font-size: 8px;
          }
          tr:nth-child(even) { background: #f9fafb; }
          .status-present { color: #16a34a; font-weight: 600; }
          .status-absent { color: #dc2626; font-weight: 600; }
          .status-other { color: #ca8a04; font-weight: 600; }
          .summary {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
            margin-top: 8px;
            padding: 6px;
            background: #f0f9ff;
            border-radius: 4px;
            border: 1px solid #bae6fd;
          }
          .summary-item { 
            text-align: center; 
            padding: 4px;
            background: white;
            border-radius: 4px;
          }
          .summary-item strong { display: block; font-size: 12px; color: #1e40af; }
          .summary-item span { font-size: 7px; color: #6b7280; }
          .footer {
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
            table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("hr.monthlyEditor.printTitle")}</h1>
          <p>${format(selectedMonth, "MMMM yyyy", { locale: ar })}</p>
        </div>

        <div class="employee-info">
          <div>
            <strong>${t("hr.monthlyEditor.employeeName")}</strong>
            <span>${escapeHtml(employee.name)}</span>
          </div>
          <div>
            <strong>${t("hr.monthlyEditor.employeeNumber")}</strong>
            <span>${escapeHtml(employee.employeeNumber) || "-"}</span>
          </div>
          <div>
            <strong>${t("hr.monthlyEditor.department")}</strong>
            <span>${escapeHtml(employee.department) || "-"}</span>
          </div>
          <div>
            <strong>${t("hr.monthlyEditor.jobTitle")}</strong>
            <span>${escapeHtml(employee.position) || "-"}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${t("hr.monthlyEditor.date")}</th>
              <th>${t("hr.monthlyEditor.day")}</th>
              <th>${t("common.status")}</th>
              <th>${t("hr.checkInTime")}</th>
              <th>${t("hr.checkOutTime")}</th>
              <th>${t("hr.workHours")}</th>
              <th>${t("hr.monthlyEditor.notes")}</th>
            </tr>
          </thead>
          <tbody>
            ${recordRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-item">
            <strong>${summary.presentDays}</strong>
            <span>${t("hr.monthlyEditor.presentDays")}</span>
          </div>
          <div class="summary-item">
            <strong>${summary.absentDays}</strong>
            <span>${t("hr.monthlyEditor.absentDays")}</span>
          </div>
          <div class="summary-item">
            <strong>${summary.leaveDays}</strong>
            <span>${t("hr.monthlyEditor.leaveDays")}</span>
          </div>
          <div class="summary-item">
            <strong>${summary.lateDays}</strong>
            <span>${t("hr.monthlyEditor.lateDays")}</span>
          </div>
          <div class="summary-item">
            <strong>${summary.totalWorkHours.toFixed(1)}</strong>
            <span>${t("hr.workHours")}</span>
          </div>
          <div class="summary-item">
            <strong>${summary.totalOvertimeHours.toFixed(1)}</strong>
            <span>${t("hr.monthlyEditor.overtimeHours")}</span>
          </div>
        </div>

        <div class="footer">
          <span>${t("hr.monthlyEditor.reportGenerated")}: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ar })}</span>
          <span>${t("hr.monthlyEditor.hrSystem")}</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {status || "-"}
      </Badge>
    );
  };

  const employees = Array.isArray(usersData)
    ? usersData
    : usersData?.data || [];
  const records = attendanceData?.data?.records || [];
  const employee = attendanceData?.data?.employee;
  const summary = attendanceData?.data?.summary;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                {t("hr.monthlyEditor.title")}
              </CardTitle>
              <CardDescription>
                {t("hr.monthlyEditor.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">
                {t("hr.monthlyEditor.selectEmployee")}
              </label>
              <Select
                value={selectedEmployeeId}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "hr.monthlyEditor.selectEmployeePlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.display_name_ar ||
                        user.display_name ||
                        user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg min-w-[180px] justify-center">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-medium">
                  {format(selectedMonth, "MMMM yyyy", { locale: ar })}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              {canEditHr && (
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("hr.monthlyEditor.saveChanges")}
              </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!selectedEmployeeId || !attendanceData?.data}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                {t("hr.monthlyEditor.printReport")}
              </Button>
            </div>
          </div>

          {!selectedEmployeeId ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("hr.monthlyEditor.selectEmployeePrompt")}</p>
            </div>
          ) : attendanceLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-2 text-gray-500">{t("common.loading")}...</p>
            </div>
          ) : (
            <>
              {employee && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("hr.monthlyEditor.employeeName")}:
                    </span>
                    <p className="font-medium">{employee.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("hr.monthlyEditor.employeeNumber")}:
                    </span>
                    <p className="font-medium">
                      {employee.employeeNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("hr.monthlyEditor.department")}:
                    </span>
                    <p className="font-medium">{employee.department || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("hr.monthlyEditor.jobTitle")}:
                    </span>
                    <p className="font-medium">{employee.position || "-"}</p>
                  </div>
                </div>
              )}

              {summary && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-3 text-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-green-700">
                      {summary.presentDays}
                    </div>
                    <div className="text-xs text-green-600">
                      {t("hr.monthlyEditor.present")}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-lg p-3 text-center">
                    <XCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-red-700">
                      {summary.absentDays}
                    </div>
                    <div className="text-xs text-red-600">
                      {t("hr.monthlyEditor.absent")}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-3 text-center">
                    <CalendarIcon className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-blue-700">
                      {summary.leaveDays}
                    </div>
                    <div className="text-xs text-blue-600">
                      {t("hr.monthlyEditor.leave")}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-orange-700">
                      {summary.lateDays}
                    </div>
                    <div className="text-xs text-orange-600">
                      {t("hr.monthlyEditor.late")}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 rounded-lg p-3 text-center">
                    <Clock className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-purple-700">
                      {summary.totalWorkHours.toFixed(1)}
                    </div>
                    <div className="text-xs text-purple-600">
                      {t("hr.workHours")}
                    </div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 rounded-lg p-3 text-center">
                    <Clock className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-indigo-700">
                      {summary.totalOvertimeHours.toFixed(1)}
                    </div>
                    <div className="text-xs text-indigo-600">
                      {t("hr.overtime")}
                    </div>
                  </div>
                </div>
              )}

              <div ref={printRef} className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table className="text-xs">
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="text-right py-1 px-2 w-[70px]">
                          {t("hr.monthlyEditor.date")}
                        </TableHead>
                        <TableHead className="text-right py-1 px-2 w-[60px]">
                          {t("hr.monthlyEditor.day")}
                        </TableHead>
                        <TableHead className="text-center py-1 px-2 w-[100px]">
                          {t("common.status")}
                        </TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">
                          {t("hr.monthlyEditor.present")}
                        </TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">
                          {t("hr.monthlyEditor.departure")}
                        </TableHead>
                        <TableHead className="text-center py-1 px-2 w-[50px]">
                          {t("hr.monthlyEditor.hours")}
                        </TableHead>
                        <TableHead className="text-right py-1 px-2">
                          {t("hr.monthlyEditor.notes")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-gray-500"
                          >
                            {t("hr.monthlyEditor.noData")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((record) => {
                          const isModified = modifiedRecords.has(record.date);
                          const isFriday = record.dayName === "الجمعة";

                          return (
                            <TableRow
                              key={record.date}
                              className={`
                                ${isModified ? "bg-yellow-50 dark:bg-yellow-950" : ""} 
                                ${isFriday ? "bg-gray-100 dark:bg-gray-800" : ""}
                                hover:bg-gray-50 dark:hover:bg-gray-800
                              `}
                            >
                              <TableCell className="font-medium py-1 px-2">
                                {format(new Date(record.date), "dd/MM")}
                              </TableCell>
                              <TableCell
                                className={`py-1 px-2 ${isFriday ? "font-bold text-red-600" : ""}`}
                              >
                                {record.dayName}
                              </TableCell>
                              <TableCell className="text-center py-1 px-2">
                                <Select
                                  value={
                                    getRecordValue(
                                      record.date,
                                      "status",
                                      record.status,
                                    ) || "غائب"
                                  }
                                  onValueChange={(value) =>
                                    handleFieldChange(
                                      record.date,
                                      "status",
                                      value,
                                      record,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-6 w-[90px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {t(option.labelKey)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-center py-1 px-2">
                                <Input
                                  type="time"
                                  value={
                                    getRecordValue(
                                      record.date,
                                      "check_in_time",
                                      record.check_in_time,
                                    ) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      record.date,
                                      "check_in_time",
                                      e.target.value || null,
                                      record,
                                    )
                                  }
                                  className="h-6 w-[75px] text-center text-xs px-1"
                                />
                              </TableCell>
                              <TableCell className="text-center py-1 px-2">
                                <Input
                                  type="time"
                                  value={
                                    getRecordValue(
                                      record.date,
                                      "check_out_time",
                                      record.check_out_time,
                                    ) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      record.date,
                                      "check_out_time",
                                      e.target.value || null,
                                      record,
                                    )
                                  }
                                  className="h-6 w-[75px] text-center text-xs px-1"
                                />
                              </TableCell>
                              <TableCell className="text-center font-mono py-1 px-2">
                                {record.work_hours
                                  ? record.work_hours.toFixed(1)
                                  : "-"}
                              </TableCell>
                              <TableCell className="py-1 px-2">
                                <Input
                                  value={
                                    getRecordValue(
                                      record.date,
                                      "notes",
                                      record.notes,
                                    ) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      record.date,
                                      "notes",
                                      e.target.value,
                                      record,
                                    )
                                  }
                                  placeholder={t(
                                    "hr.monthlyEditor.notesPlaceholder",
                                  )}
                                  className="h-6 text-xs"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {hasChanges && canEditHr && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded-lg flex items-center justify-between">
                  <span className="text-yellow-800 dark:text-yellow-200">
                    {t("hr.monthlyEditor.unsavedChanges", {
                      count: modifiedRecords.size,
                    })}
                  </span>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    size="sm"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    {t("hr.monthlyEditor.saveNow")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
