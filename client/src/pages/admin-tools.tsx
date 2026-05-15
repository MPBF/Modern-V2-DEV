import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  FileSignature,
  FileText,
  Plus,
  Printer,
  Trash2,
  Edit,
  FilePlus,
  FolderOpen,
  Save,
  Truck,
  Upload,
  Users2,
  Package,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import PageLayout from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useAuth } from "../hooks/use-auth";
import { useCompanyLogo } from "../hooks/use-company-logo";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";

type Customer = {
  id: string;
  name: string;
  name_ar?: string | null;
  phone?: string | null;
  city?: string | null;
};

type RollRow = {
  id: string;
  description: string;
  quantity: string;
  weight: string;
  notes: string;
};

type ReportSection = { id: string; heading: string; body: string };
type ReportTableRow = { id: string; col1: string; col2: string; col3: string };
type AgendaItem = { id: string; topic: string; discussion: string };
type ActionItem = { id: string; task: string; owner: string; due: string };
type AssetItem = {
  id: string;
  name: string;
  serial: string;
  qty: string;
  condition: string;
};

type DeliveryStop = {
  id: string;
  customerId: string;
  customerName: string;
  contactPhone: string;
  inChargeName: string;
  notes: string;
  imageDataUrl: string;
  zone: number; // 1..TRUCK_ZONES
};

const TRUCK_ZONES = 8;
const ZONE_COLORS = [
  "#fca5a5",
  "#fcd34d",
  "#86efac",
  "#7dd3fc",
  "#c4b5fd",
  "#f9a8d4",
  "#fdba74",
  "#a3e635",
];

const uid = () => Math.random().toString(36).slice(2, 10);

const todayISO = () => new Date().toISOString().slice(0, 10);

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printRef(el: HTMLElement | null, title: string) {
  if (!el) return;
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  const safeTitle = escapeHtml(title);
  const styles = `
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #111; margin: 0; padding: 16px; }
    .doc { max-width: 800px; margin: 0 auto; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .doc-header img { max-height: 64px; }
    .doc-title { font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 4px; }
    .doc-subtitle { font-size: 12px; color: #555; text-align: center; margin: 0; }
    .doc-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; font-size: 13px; margin-bottom: 16px; }
    .doc-meta div { display: flex; gap: 6px; }
    .doc-meta b { color: #333; }
    h2.section { font-size: 15px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #999; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: start; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    .body-text { white-space: pre-wrap; font-size: 13px; line-height: 1.7; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
    .sig { text-align: center; font-size: 12px; }
    .sig-line { margin: 36px 12px 6px; border-top: 1px solid #111; }
    .disclaimer { background: #fff7ed; border: 1px solid #fdba74; padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.7; white-space: pre-wrap; }
    .footer { margin-top: 32px; font-size: 11px; color: #666; text-align: center; border-top: 1px dashed #999; padding-top: 8px; }
    @media print { .no-print { display: none !important; } }
  `;
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${safeTitle}</title><style>${styles}</style></head><body>${el.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 250);
}

function DocHeader({
  logoUrl,
  title,
  subtitle,
}: {
  logoUrl: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="doc-header">
      <img src={logoUrl} alt="logo" />
      <div style={{ flex: 1 }}>
        <h1 className="doc-title">{title}</h1>
        {subtitle && <p className="doc-subtitle">{subtitle}</p>}
      </div>
      <div style={{ width: 64 }} />
    </div>
  );
}

function SignatureBlock({
  labels,
}: {
  labels: { label: string; name?: string }[];
}) {
  return (
    <div className="signatures">
      {labels.map((l, i) => (
        <div key={i} className="sig">
          <div className="sig-line" />
          <div>{l.label}</div>
          {l.name && <div style={{ marginTop: 4, fontWeight: 600 }}>{l.name}</div>}
        </div>
      ))}
    </div>
  );
}

// ------------------------------- Tab 1 ----------------------------------
function DeliveryDisclaimerTab({ logoUrl }: { logoUrl: string }) {
  const { toast } = useToast();
  const { data: customersResp } = useQuery<Customer[]>({
    queryKey: ["/api/customers", { all: true }],
    staleTime: 5 * 60 * 1000,
  });
  const customers = Array.isArray(customersResp) ? customersResp : [];

  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState(`DLV-${Date.now().toString().slice(-6)}`);
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [rows, setRows] = useState<RollRow[]>([
    { id: uid(), description: "", quantity: "", weight: "", notes: "" },
  ]);
  const defaultDisclaimer = `أقر أنا الموقع أدناه باستلام الاصناف المذكورة أعلاه بحالتها وكميتها ومواصفاتها كما هي مبينة في هذا النموذج، وأخلي مسؤولية  (مصنع أكياس البلاستيك الحديث) من أي عيوب أو نواقص أو أضرار قد تظهر بعد توقيعي على هذا النموذج، حيث تم فحص البضاعة والتأكد من مطابقتها قبل التوقيع. كما أتحمل كامل المسؤولية عن نقل البضاعة وتخزينها بعد لحظة الاستلام.`;
  const [disclaimer, setDisclaimer] = useState(defaultDisclaimer);
  const printArea = useRef<HTMLDivElement>(null);

  const customer = customers.find((c) => c.id === customerId);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { id: uid(), description: "", quantity: "", weight: "", notes: "" },
    ]);
  const removeRow = (id: string) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id: string, k: keyof RollRow, v: string) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const totals = useMemo(() => {
    const qty = rows.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
    const wt = rows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0);
    return { qty, wt };
  }, [rows]);

  const handlePrint = () => {
    if (!customer) {
      toast({
        title: "تنبيه",
        description: "اختر العميل أولاً",
        variant: "destructive",
      });
      return;
    }
    printRef(printArea.current, `Delivery-${reference}`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>العميل *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-delivery-customer">
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_ar || c.name} ({c.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>رقم النموذج</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div>
              <Label>رقم الجوال:</Label>
              <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
            </div>
            <div>
              <Label>اسم المفوض</Label>
              <Input value={driver} onChange={(e) => setDriver(e.target.value)} />
            </div>
            <div>
              <Label>اسم المستلم</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">الأصناف المُسلَّمة</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addRow}
                data-testid="btn-add-delivery-row"
              >
                <Plus className="h-4 w-4 me-1" /> إضافة صف
              </Button>
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-start">الوصف</th>
                    <th className="p-2 text-start w-24">الكمية</th>
                    <th className="p-2 text-start w-28">الوحدة </th>
                    <th className="p-2 text-start">ملاحظات</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1">
                        <Input
                          value={r.description}
                          onChange={(e) => updateRow(r.id, "description", e.target.value)}
                          placeholder="نوع/مقاس "
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={r.quantity}
                          onChange={(e) => updateRow(r.id, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={r.weight}
                          onChange={(e) => updateRow(r.id, "weight", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={r.notes}
                          onChange={(e) => updateRow(r.id, "notes", e.target.value)}
                        />
                      </td>
                      <td className="p-1 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRow(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/60 font-semibold">
                  <tr>
                    <td className="p-2 text-end">الإجمالي</td>
                    <td className="p-2">{totals.qty.toFixed(0)}</td>
                    <td className="p-2">{totals.wt.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <Label>إخلاء المسؤولية</Label>
            <Textarea
              rows={4}
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePrint} data-testid="btn-print-delivery">
              <Printer className="h-4 w-4 me-2" /> طباعة وحفظ PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden printable area */}
      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader
            logoUrl={logoUrl}
            title="نموذج تسليم وإخلاء مسؤولية"
            subtitle="Delivery & Disclaimer Form"
          />
          <div className="doc-meta">
            <div>
              <b>العميل:</b> {customer?.name_ar || customer?.name || "-"}
            </div>
            <div>
              <b>كود العميل:</b> {customer?.id || "-"}
            </div>
            <div>
              <b>التاريخ:</b> {date}
            </div>
            <div>
              <b>رقم النموذج:</b> {reference}
            </div>
            <div>
              <b>الجوال:</b> {vehicle || "-"}
            </div>
            <div>
              <b>المفوض:</b> {driver || "-"}
            </div>
          </div>

          <h2 className="section">الأصناف المسلمة</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>الوحدة </th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.description}</td>
                  <td>{r.quantity}</td>
                  <td>{r.weight}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{ textAlign: "end", fontWeight: 600 }}>
                  الإجمالي
                </td>
                <td style={{ fontWeight: 600 }}>{totals.qty.toFixed(0)}</td>
                <td style={{ fontWeight: 600 }}>{totals.wt.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <h2 className="section">إخلاء المسؤولية</h2>
          <div className="disclaimer">{disclaimer}</div>

          <SignatureBlock
            labels={[
              { label: "توقيع المستلم", name: recipientName || customer?.name_ar || customer?.name },
              { label: "توقيع المفوض", name: driver },
              { label: "توقيع المسؤول" },
            ]}
          />
          <div className="footer">
            تم إصدار هذا النموذج إلكترونياً بتاريخ {date} • نظام MPBF
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Tab 2 ----------------------------------
function AdminOrderTab({ logoUrl }: { logoUrl: string }) {
  const { user } = useAuth();
  const [number, setNumber] = useState(`AO-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(todayISO());
  const [subject, setSubject] = useState("");
  const [recipient, setRecipient] = useState("");
  const [department, setDepartment] = useState("");
  const [body, setBody] = useState("");
  const [issuer, setIssuer] = useState((user as any)?.name || (user as any)?.username || "");
  const [issuerTitle, setIssuerTitle] = useState("الإدارة");
  const printArea = useRef<HTMLDivElement>(null);

  const handlePrint = () => printRef(printArea.current, `AdminOrder-${number}`);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>رقم القرار</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>الموضوع *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>إلى</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="الاسم / الجهة"
              />
            </div>
            <div>
              <Label>الإدارة / القسم</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <Label>صادر عن</Label>
              <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} />
            </div>
            <div>
              <Label>المسمى الوظيفي</Label>
              <Input
                value={issuerTitle}
                onChange={(e) => setIssuerTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>نص الأمر الإداري *</Label>
            <Textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب نص الأمر الإداري بشكل واضح..."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePrint} data-testid="btn-print-admin-order">
              <Printer className="h-4 w-4 me-2" /> طباعة وحفظ PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader
            logoUrl={logoUrl}
            title="أمر إداري"
            subtitle="Administrative Order"
          />
          <div className="doc-meta">
            <div>
              <b>رقم القرار:</b> {number}
            </div>
            <div>
              <b>التاريخ:</b> {date}
            </div>
            <div>
              <b>إلى:</b> {recipient || "-"}
            </div>
            <div>
              <b>الإدارة:</b> {department || "-"}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <b>الموضوع:</b> {subject || "-"}
            </div>
          </div>
          <h2 className="section">نص الأمر</h2>
          <div className="body-text">{body}</div>
          <SignatureBlock
            labels={[
              { label: issuerTitle, name: issuer },
              { label: "الختم الرسمي" },
              { label: "تم الاطلاع", name: recipient },
            ]}
          />
          <div className="footer">صادر من نظام MPBF • {date}</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Tab 3 ----------------------------------
function CustomReportTab({ logoUrl }: { logoUrl: string }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [period, setPeriod] = useState("");
  const [date, setDate] = useState(todayISO());
  const [sections, setSections] = useState<ReportSection[]>([
    { id: uid(), heading: "المقدمة", body: "" },
  ]);
  const [tableHeaders, setTableHeaders] = useState({
    col1: "البند",
    col2: "القيمة",
    col3: "ملاحظات",
  });
  const [tableRows, setTableRows] = useState<ReportTableRow[]>([
    { id: uid(), col1: "", col2: "", col3: "" },
  ]);
  const [conclusion, setConclusion] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const printArea = useRef<HTMLDivElement>(null);

  const addSection = () =>
    setSections((s) => [...s, { id: uid(), heading: "", body: "" }]);
  const removeSection = (id: string) =>
    setSections((s) => s.filter((x) => x.id !== id));
  const updateSection = (id: string, k: "heading" | "body", v: string) =>
    setSections((s) => s.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const addTableRow = () =>
    setTableRows((r) => [...r, { id: uid(), col1: "", col2: "", col3: "" }]);
  const removeTableRow = (id: string) =>
    setTableRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateTableRow = (id: string, k: keyof ReportTableRow, v: string) =>
    setTableRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const handlePrint = () =>
    printRef(printArea.current, `Report-${title || date}`);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>عنوان التقرير *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>العنوان الفرعي</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div>
              <Label>الفترة الزمنية</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="مثلاً: من 1/1 إلى 31/3"
              />
            </div>
            <div>
              <Label>تاريخ الإصدار</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>أُعدّ بواسطة</Label>
              <Input
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">أقسام التقرير</Label>
              <Button size="sm" variant="outline" onClick={addSection}>
                <Plus className="h-4 w-4 me-1" /> إضافة قسم
              </Button>
            </div>
            {sections.map((s, i) => (
              <Card key={s.id} className="border-dashed">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={s.heading}
                      onChange={(e) => updateSection(s.id, "heading", e.target.value)}
                      placeholder={`عنوان القسم ${i + 1}`}
                      className="font-semibold"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSection(s.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Textarea
                    rows={4}
                    value={s.body}
                    onChange={(e) => updateSection(s.id, "body", e.target.value)}
                    placeholder="محتوى القسم..."
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">جدول البيانات</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={tableHeaders.col1}
                onChange={(e) =>
                  setTableHeaders({ ...tableHeaders, col1: e.target.value })
                }
                placeholder="عنوان عمود 1"
              />
              <Input
                value={tableHeaders.col2}
                onChange={(e) =>
                  setTableHeaders({ ...tableHeaders, col2: e.target.value })
                }
                placeholder="عنوان عمود 2"
              />
              <Input
                value={tableHeaders.col3}
                onChange={(e) =>
                  setTableHeaders({ ...tableHeaders, col3: e.target.value })
                }
                placeholder="عنوان عمود 3"
              />
            </div>
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-start">{tableHeaders.col1}</th>
                    <th className="p-2 text-start">{tableHeaders.col2}</th>
                    <th className="p-2 text-start">{tableHeaders.col3}</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1">
                        <Input
                          value={r.col1}
                          onChange={(e) => updateTableRow(r.id, "col1", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={r.col2}
                          onChange={(e) => updateTableRow(r.id, "col2", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={r.col3}
                          onChange={(e) => updateTableRow(r.id, "col3", e.target.value)}
                        />
                      </td>
                      <td className="p-1 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTableRow(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button size="sm" variant="outline" onClick={addTableRow}>
              <Plus className="h-4 w-4 me-1" /> إضافة صف
            </Button>
          </div>

          <div>
            <Label>الخلاصة / التوصيات</Label>
            <Textarea
              rows={4}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePrint} data-testid="btn-print-report">
              <Printer className="h-4 w-4 me-2" /> طباعة وحفظ PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader logoUrl={logoUrl} title={title || "تقرير"} subtitle={subtitle} />
          <div className="doc-meta">
            <div>
              <b>التاريخ:</b> {date}
            </div>
            <div>
              <b>الفترة:</b> {period || "-"}
            </div>
            <div>
              <b>أُعدّ بواسطة:</b> {preparedBy || "-"}
            </div>
          </div>
          {sections.map(
            (s) =>
              (s.heading || s.body) && (
                <div key={s.id}>
                  <h2 className="section">{s.heading}</h2>
                  <div className="body-text">{s.body}</div>
                </div>
              ),
          )}
          {tableRows.some((r) => r.col1 || r.col2 || r.col3) && (
            <>
              <h2 className="section">البيانات التفصيلية</h2>
              <table>
                <thead>
                  <tr>
                    <th>{tableHeaders.col1}</th>
                    <th>{tableHeaders.col2}</th>
                    <th>{tableHeaders.col3}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.col1}</td>
                      <td>{r.col2}</td>
                      <td>{r.col3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {conclusion && (
            <>
              <h2 className="section">الخلاصة والتوصيات</h2>
              <div className="body-text">{conclusion}</div>
            </>
          )}
          <SignatureBlock
            labels={[
              { label: "إعداد", name: preparedBy },
              { label: "مراجعة" },
              { label: "اعتماد" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Tab 4 ----------------------------------
function MeetingMinutesTab({ logoUrl }: { logoUrl: string }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [chair, setChair] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { id: uid(), topic: "", discussion: "" },
  ]);
  const [actions, setActions] = useState<ActionItem[]>([
    { id: uid(), task: "", owner: "", due: "" },
  ]);
  const printArea = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>عنوان الاجتماع *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>الوقت</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <Label>المكان</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label>رئيس الاجتماع</Label>
              <Input value={chair} onChange={(e) => setChair(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>الحضور (اسم في كل سطر)</Label>
            <Textarea
              rows={3}
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">جدول الأعمال والمناقشات</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAgenda((a) => [...a, { id: uid(), topic: "", discussion: "" }])
                }
              >
                <Plus className="h-4 w-4 me-1" /> إضافة بند
              </Button>
            </div>
            {agenda.map((a, i) => (
              <Card key={a.id} className="border-dashed">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={a.topic}
                      placeholder={`البند ${i + 1}`}
                      onChange={(e) =>
                        setAgenda((arr) =>
                          arr.map((x) =>
                            x.id === a.id ? { ...x, topic: e.target.value } : x,
                          ),
                        )
                      }
                      className="font-semibold"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setAgenda((arr) => arr.filter((x) => x.id !== a.id))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Textarea
                    rows={3}
                    value={a.discussion}
                    placeholder="ملخص المناقشة والقرار..."
                    onChange={(e) =>
                      setAgenda((arr) =>
                        arr.map((x) =>
                          x.id === a.id ? { ...x, discussion: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">الإجراءات والمسؤوليات</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setActions((a) => [
                    ...a,
                    { id: uid(), task: "", owner: "", due: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 me-1" /> إضافة إجراء
              </Button>
            </div>
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-start">المهمة</th>
                    <th className="p-2 text-start w-40">المسؤول</th>
                    <th className="p-2 text-start w-40">تاريخ التنفيذ</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-1">
                        <Input
                          value={a.task}
                          onChange={(e) =>
                            setActions((arr) =>
                              arr.map((x) =>
                                x.id === a.id ? { ...x, task: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={a.owner}
                          onChange={(e) =>
                            setActions((arr) =>
                              arr.map((x) =>
                                x.id === a.id ? { ...x, owner: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="date"
                          value={a.due}
                          onChange={(e) =>
                            setActions((arr) =>
                              arr.map((x) =>
                                x.id === a.id ? { ...x, due: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setActions((arr) => arr.filter((x) => x.id !== a.id))
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => printRef(printArea.current, `Minutes-${date}`)}
              data-testid="btn-print-minutes"
            >
              <Printer className="h-4 w-4 me-2" /> طباعة وحفظ PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader
            logoUrl={logoUrl}
            title={title || "محضر اجتماع"}
            subtitle="Meeting Minutes"
          />
          <div className="doc-meta">
            <div>
              <b>التاريخ:</b> {date}
            </div>
            <div>
              <b>الوقت:</b> {time}
            </div>
            <div>
              <b>المكان:</b> {location || "-"}
            </div>
            <div>
              <b>رئيس الاجتماع:</b> {chair || "-"}
            </div>
          </div>
          <h2 className="section">الحضور</h2>
          <div className="body-text">{attendees}</div>
          <h2 className="section">جدول الأعمال والمناقشات</h2>
          {agenda.map((a, i) => (
            <div key={a.id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>
                {i + 1}. {a.topic}
              </div>
              <div className="body-text">{a.discussion}</div>
            </div>
          ))}
          <h2 className="section">الإجراءات والمسؤوليات</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>المهمة</th>
                <th>المسؤول</th>
                <th>تاريخ التنفيذ</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td>{a.task}</td>
                  <td>{a.owner}</td>
                  <td>{a.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <SignatureBlock
            labels={[
              { label: "رئيس الاجتماع", name: chair },
              { label: "محرر المحضر" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Tab 5 ----------------------------------
function AssetHandoverTab({ logoUrl }: { logoUrl: string }) {
  const [employee, setEmployee] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<AssetItem[]>([
    { id: uid(), name: "", serial: "", qty: "1", condition: "جديد" },
  ]);
  const [terms, setTerms] = useState(
    `أقر أنا الموظف الموقع أدناه باستلام العهدة الموضحة أعلاه بحالتها المذكورة، وأتعهد بالمحافظة عليها واستخدامها للأغراض الوظيفية فقط، وإعادتها بنفس الحالة عند انتهاء العمل أو طلب الشركة لها. وفي حال أي تلف أو فقدان ناتج عن إهمال أتحمل قيمتها كاملة.`,
  );
  const printArea = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>اسم الموظف *</Label>
              <Input
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              />
            </div>
            <div>
              <Label>رقم الموظف</Label>
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div>
              <Label>القسم</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">قائمة العهدة</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems((a) => [
                    ...a,
                    { id: uid(), name: "", serial: "", qty: "1", condition: "جديد" },
                  ])
                }
              >
                <Plus className="h-4 w-4 me-1" /> إضافة عنصر
              </Button>
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-start">الصنف</th>
                    <th className="p-2 text-start w-40">الرقم التسلسلي</th>
                    <th className="p-2 text-start w-20">الكمية</th>
                    <th className="p-2 text-start w-32">الحالة</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-1">
                        <Input
                          value={it.name}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === it.id ? { ...x, name: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={it.serial}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === it.id ? { ...x, serial: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === it.id ? { ...x, qty: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={it.condition}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === it.id ? { ...x, condition: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="p-1 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setItems((arr) =>
                              arr.length > 1 ? arr.filter((x) => x.id !== it.id) : arr,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Label>تعهد الاستلام</Label>
            <Textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => printRef(printArea.current, `Handover-${employee}`)}
              data-testid="btn-print-handover"
            >
              <Printer className="h-4 w-4 me-2" /> طباعة وحفظ PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader
            logoUrl={logoUrl}
            title="نموذج تسليم عهدة"
            subtitle="Asset Handover Form"
          />
          <div className="doc-meta">
            <div>
              <b>اسم الموظف:</b> {employee}
            </div>
            <div>
              <b>رقم الموظف:</b> {employeeId || "-"}
            </div>
            <div>
              <b>القسم:</b> {department || "-"}
            </div>
            <div>
              <b>التاريخ:</b> {date}
            </div>
          </div>
          <h2 className="section">قائمة العهدة</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الصنف</th>
                <th>الرقم التسلسلي</th>
                <th>الكمية</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id}>
                  <td>{i + 1}</td>
                  <td>{it.name}</td>
                  <td>{it.serial || "-"}</td>
                  <td>{it.qty}</td>
                  <td>{it.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="section">تعهد الاستلام</h2>
          <div className="disclaimer">{terms}</div>
          <SignatureBlock
            labels={[
              { label: "توقيع الموظف", name: employee },
              { label: "المسلِّم" },
              { label: "اعتماد الإدارة" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Truck SVG ------------------------------
function TruckDiagram({
  assignments,
  onZoneClick,
  selectedZone,
}: {
  assignments: Record<number, { name: string; color: string }>;
  onZoneClick?: (zone: number) => void;
  selectedZone?: number;
}) {
  // 8 cargo zones inside the trailer body. Trailer drawn side-view.
  const zoneW = 80;
  const zoneH = 110;
  const startX = 30;
  const startY = 30;
  const cols = 8;
  return (
    <svg
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxHeight: 260 }}
    >
      {/* Cab */}
      <rect x="660" y="60" width="80" height="80" rx="6" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2" />
      <rect x="668" y="70" width="55" height="35" rx="3" fill="#bfdbfe" stroke="#0f172a" />
      <rect x="685" y="115" width="35" height="22" fill="#374151" />
      {/* Trailer body outline */}
      <rect
        x={startX - 10}
        y={startY - 10}
        width={cols * zoneW + 20}
        height={zoneH + 20}
        rx="4"
        fill="#f3f4f6"
        stroke="#0f172a"
        strokeWidth="2"
      />
      {/* Zones */}
      {Array.from({ length: cols }).map((_, i) => {
        const zone = i + 1;
        const a = assignments[zone];
        const x = startX + i * zoneW;
        const isSel = selectedZone === zone;
        return (
          <g
            key={zone}
            onClick={() => onZoneClick?.(zone)}
            style={{ cursor: onZoneClick ? "pointer" : "default" }}
          >
            <rect
              x={x}
              y={startY}
              width={zoneW - 4}
              height={zoneH}
              fill={a?.color || "#ffffff"}
              stroke={isSel ? "#dc2626" : "#475569"}
              strokeWidth={isSel ? 3 : 1}
            />
            <text
              x={x + (zoneW - 4) / 2}
              y={startY + 16}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#0f172a"
            >
              {zone}
            </text>
            {a?.name && (
              <foreignObject x={x + 2} y={startY + 22} width={zoneW - 8} height={zoneH - 26}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#0f172a",
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    wordBreak: "break-word",
                    direction: "rtl",
                    fontFamily: "Tahoma, Arial, sans-serif",
                  }}
                >
                  {a.name}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
      {/* Back door indicator */}
      <line x1={startX - 10} y1={startY - 10} x2={startX - 10} y2={startY + zoneH + 10} stroke="#dc2626" strokeWidth="3" />
      <text x={startX - 18} y={startY + zoneH / 2} textAnchor="middle" fontSize="10" fill="#dc2626" transform={`rotate(-90 ${startX - 18} ${startY + zoneH / 2})`}>الباب الخلفي</text>
      {/* Wheels */}
      <circle cx={startX + 30} cy={startY + zoneH + 18} r="14" fill="#111827" />
      <circle cx={startX + 30} cy={startY + zoneH + 18} r="6" fill="#9ca3af" />
      <circle cx={startX + 110} cy={startY + zoneH + 18} r="14" fill="#111827" />
      <circle cx={startX + 110} cy={startY + zoneH + 18} r="6" fill="#9ca3af" />
      <circle cx={startX + cols * zoneW - 30} cy={startY + zoneH + 18} r="14" fill="#111827" />
      <circle cx={startX + cols * zoneW - 30} cy={startY + zoneH + 18} r="6" fill="#9ca3af" />
      <circle cx={680} cy={startY + zoneH + 18} r="14" fill="#111827" />
      <circle cx={680} cy={startY + zoneH + 18} r="6" fill="#9ca3af" />
      <circle cx={720} cy={startY + zoneH + 18} r="14" fill="#111827" />
      <circle cx={720} cy={startY + zoneH + 18} r="6" fill="#9ca3af" />
      {/* Ground */}
      <line x1="0" y1={startY + zoneH + 35} x2="760" y2={startY + zoneH + 35} stroke="#9ca3af" strokeWidth="2" strokeDasharray="6 4" />
    </svg>
  );
}

// ------------------------------- Tab 6 ----------------------------------
function DeliveryRouteTab({ logoUrl }: { logoUrl: string }) {
  const { toast } = useToast();
  const { data: customersResp } = useQuery<Customer[]>({
    queryKey: ["/api/customers", { all: true }],
    staleTime: 5 * 60 * 1000,
  });
  const customers = Array.isArray(customersResp) ? customersResp : [];

  const [date, setDate] = useState(todayISO());
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [driver, setDriver] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [reference, setReference] = useState(`RT-${Date.now().toString().slice(-6)}`);
  const [stops, setStops] = useState<DeliveryStop[]>([
    {
      id: uid(),
      customerId: "",
      customerName: "",
      contactPhone: "",
      inChargeName: "",
      notes: "",
      imageDataUrl: "",
      zone: 1,
    },
  ]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const printArea = useRef<HTMLDivElement>(null);

  type SavedManifest = {
    id: number;
    reference: string;
    delivery_date: string | null;
    vehicle_plate: string | null;
    driver: string | null;
    driver_phone: string | null;
    stops: DeliveryStop[];
    created_at: string;
    updated_at: string;
  };

  const {
    data: manifestsResp,
    isLoading: isLoadingManifests,
    isError: isManifestsError,
  } = useQuery<{ data: SavedManifest[] }>({
    queryKey: ["/api/delivery-manifests"],
    staleTime: 30 * 1000,
  });
  const manifests = manifestsResp?.data || [];

  const resetForm = () => {
    setCurrentId(null);
    setReference(`RT-${Date.now().toString().slice(-6)}`);
    setDate(todayISO());
    setVehiclePlate("");
    setDriver("");
    setDriverPhone("");
    setStops([
      {
        id: uid(),
        customerId: "",
        customerName: "",
        contactPhone: "",
        inChargeName: "",
        notes: "",
        imageDataUrl: "",
        zone: 1,
      },
    ]);
  };

  const loadManifest = (m: SavedManifest) => {
    setCurrentId(m.id);
    setReference(m.reference);
    setDate(m.delivery_date || todayISO());
    setVehiclePlate(m.vehicle_plate || "");
    setDriver(m.driver || "");
    setDriverPhone(m.driver_phone || "");
    const loadedStops = Array.isArray(m.stops) && m.stops.length > 0
      ? m.stops.map((s) => ({ ...s, id: s.id || uid() }))
      : [
          {
            id: uid(),
            customerId: "",
            customerName: "",
            contactPhone: "",
            inChargeName: "",
            notes: "",
            imageDataUrl: "",
            zone: 1,
          },
        ];
    setStops(loadedStops);
    toast({
      title: "تم التحميل",
      description: `تم تحميل الكشف ${m.reference} للتعديل`,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        reference,
        delivery_date: date,
        vehicle_plate: vehiclePlate,
        driver,
        driver_phone: driverPhone,
        stops,
      };
      const res = await apiRequest(
        currentId
          ? `/api/delivery-manifests/${currentId}`
          : "/api/delivery-manifests",
        {
          method: currentId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      return (await res.json()) as SavedManifest;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-manifests"] });
      if (saved && typeof saved.id === "number") {
        setCurrentId(saved.id);
      }
      toast({
        title: "تم الحفظ",
        description: currentId
          ? "تم تحديث الكشف بنجاح"
          : "تم حفظ الكشف بنجاح",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطأ",
        description: err?.message || "تعذر حفظ الكشف",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/delivery-manifests/${id}`, { method: "DELETE" });
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-manifests"] });
      if (currentId === id) resetForm();
      toast({ title: "تم الحذف", description: "تم حذف الكشف" });
    },
    onError: (err: any) => {
      toast({
        title: "خطأ",
        description: err?.message || "تعذر حذف الكشف",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (stops.every((s) => !s.customerId)) {
      toast({
        title: "تنبيه",
        description: "أضف عميلاً واحداً على الأقل قبل الحفظ",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const addStop = () => {
    if (stops.length >= TRUCK_ZONES) {
      toast({
        title: "تنبيه",
        description: `الحد الأقصى ${TRUCK_ZONES} عملاء (مواقع الشاحنة)`,
        variant: "destructive",
      });
      return;
    }
    const used = new Set(stops.map((s) => s.zone));
    let nextZone = 1;
    while (used.has(nextZone) && nextZone <= TRUCK_ZONES) nextZone++;
    setStops((s) => [
      ...s,
      {
        id: uid(),
        customerId: "",
        customerName: "",
        contactPhone: "",
        inChargeName: "",
        notes: "",
        imageDataUrl: "",
        zone: nextZone,
      },
    ]);
  };
  const removeStop = (id: string) =>
    setStops((s) => (s.length > 1 ? s.filter((x) => x.id !== id) : s));
  const updateStop = <K extends keyof DeliveryStop>(
    id: string,
    k: K,
    v: DeliveryStop[K],
  ) => setStops((s) => s.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const handleImageUpload = (id: string, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "تنبيه",
        description: "الملف يجب أن يكون صورة فقط",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "تنبيه",
        description: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }
    // Resize to max 600px width for memory + print stability
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          updateStop(id, "imageDataUrl", String(reader.result || ""));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        updateStop(id, "imageDataUrl", canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => {
        updateStop(id, "imageDataUrl", String(reader.result || ""));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const onCustomerChange = (id: string, customerId: string) => {
    const c = customers.find((x) => x.id === customerId);
    setStops((s) =>
      s.map((x) =>
        x.id === id
          ? {
              ...x,
              customerId,
              customerName: c ? c.name_ar || c.name : "",
              contactPhone: x.contactPhone || c?.phone || "",
            }
          : x,
      ),
    );
  };

  const assignments = useMemo(() => {
    const map: Record<number, { name: string; color: string }> = {};
    stops.forEach((s, i) => {
      if (s.customerName) {
        map[s.zone] = {
          name: s.customerName,
          color: ZONE_COLORS[i % ZONE_COLORS.length],
        };
      }
    });
    return map;
  }, [stops]);

  const handlePrint = () => {
    if (stops.every((s) => !s.customerId)) {
      toast({
        title: "تنبيه",
        description: "أضف عميلاً واحداً على الأقل قبل الطباعة",
        variant: "destructive",
      });
      return;
    }
    const filled = stops.filter((s) => s.customerId);
    const zonesUsed = filled.map((s) => s.zone);
    const dupZone = zonesUsed.find((z, i) => zonesUsed.indexOf(z) !== i);
    if (dupZone !== undefined) {
      toast({
        title: "تنبيه",
        description: `الموقع رقم ${dupZone} مستخدم لأكثر من عميل، يرجى تعديل المواقع`,
        variant: "destructive",
      });
      return;
    }
    printRef(printArea.current, `Route-${reference}`);
  };

  return (
    <div className="space-y-4">
      {/* Saved Manifests Panel */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              الكشوف المحفوظة ({manifests.length})
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={resetForm}
              data-testid="btn-new-manifest"
            >
              <FilePlus className="h-4 w-4 me-1" /> كشف جديد
            </Button>
          </div>
          {isLoadingManifests ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              جاري تحميل الكشوف...
            </p>
          ) : isManifestsError ? (
            <p className="text-sm text-red-600 text-center py-4">
              تعذر تحميل الكشوف المحفوظة
            </p>
          ) : manifests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد كشوف محفوظة بعد — املأ النموذج أدناه واضغط "حفظ"
            </p>
          ) : (
            <div className="border rounded-md overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-start">رقم الكشف</th>
                    <th className="p-2 text-start">التاريخ</th>
                    <th className="p-2 text-start">السائق</th>
                    <th className="p-2 text-start">اللوحة</th>
                    <th className="p-2 text-center">عدد العملاء</th>
                    <th className="p-2 text-center w-32">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {manifests.map((m) => {
                    const stopsCount = Array.isArray(m.stops)
                      ? m.stops.filter((s: any) => s.customerId).length
                      : 0;
                    const isCurrent = currentId === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={`border-t ${isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                      >
                        <td className="p-2 font-medium">
                          {m.reference}
                          {isCurrent && (
                            <span className="ms-2 text-xs text-blue-600">
                              (قيد التعديل)
                            </span>
                          )}
                        </td>
                        <td className="p-2">{m.delivery_date || "-"}</td>
                        <td className="p-2">{m.driver || "-"}</td>
                        <td className="p-2">{m.vehicle_plate || "-"}</td>
                        <td className="p-2 text-center">{stopsCount}</td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => loadManifest(m)}
                              aria-label="تعديل الكشف"
                              data-testid={`btn-load-manifest-${m.id}`}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setPendingDeleteId(m.id)}
                              aria-label="حذف الكشف"
                              data-testid={`btn-delete-manifest-${m.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {currentId && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm text-blue-700 dark:text-blue-300 border border-blue-200">
              تقوم بتعديل كشف محفوظ. اضغط "كشف جديد" لإلغاء التعديل والبدء من جديد.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>رقم الكشف</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div>
              <Label>تاريخ التوصيل</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>رقم لوحة الشاحنة</Label>
              <Input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
              />
            </div>
            <div>
              <Label>اسم السائق</Label>
              <Input value={driver} onChange={(e) => setDriver(e.target.value)} />
            </div>
            <div>
              <Label>جوال السائق</Label>
              <Input
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              مخطط الشاحنة (تريلر) — الأرقام تمثل مواقع البضاعة
            </Label>
            <div className="border rounded-md p-3 bg-white dark:bg-gray-800">
              <TruckDiagram assignments={assignments} />
            </div>
            <p className="text-xs text-muted-foreground">
              لكل عميل يمكنك تحديد رقم الموقع (1-8) من القائمة في الجدول، وسيظهر
              اسمه على الرسم تلقائياً.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">قائمة العملاء والتوصيل</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addStop}
                data-testid="btn-add-stop"
              >
                <Plus className="h-4 w-4 me-1" /> إضافة عميل
              </Button>
            </div>
            <div className="space-y-3">
              {stops.map((s, i) => (
                <Card key={s.id} className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-gray-900"
                          style={{
                            background:
                              ZONE_COLORS[i % ZONE_COLORS.length],
                          }}
                        >
                          {s.zone}
                        </span>
                        <span className="text-sm font-semibold">
                          محطة {i + 1}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStop(s.id)}
                        aria-label="حذف العميل"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">العميل</Label>
                        <Select
                          value={s.customerId}
                          onValueChange={(v) => onCustomerChange(s.id, v)}
                        >
                          <SelectTrigger
                            data-testid={`select-stop-customer-${i}`}
                          >
                            <SelectValue placeholder="اختر العميل" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name_ar || c.name} ({c.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">رقم التواصل</Label>
                        <Input
                          value={s.contactPhone}
                          onChange={(e) =>
                            updateStop(s.id, "contactPhone", e.target.value)
                          }
                          placeholder="05xxxxxxxx"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">اسم المسؤول</Label>
                        <Input
                          value={s.inChargeName}
                          onChange={(e) =>
                            updateStop(s.id, "inChargeName", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">موقع البضاعة على الشاحنة</Label>
                        <Select
                          value={String(s.zone)}
                          onValueChange={(v) =>
                            updateStop(s.id, "zone", parseInt(v, 10))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: TRUCK_ZONES }).map((_, z) => (
                              <SelectItem key={z + 1} value={String(z + 1)}>
                                موقع {z + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">ملاحظات</Label>
                        <Input
                          value={s.notes}
                          onChange={(e) => updateStop(s.id, "notes", e.target.value)}
                          placeholder="مثلاً: التوصيل بعد الظهر / يحتاج رافعة"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs">صورة الكيس / البضاعة</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <label
                            className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            <span>{s.imageDataUrl ? "تغيير الصورة" : "رفع صورة"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(s.id, e.target.files?.[0])
                              }
                            />
                          </label>
                          {s.imageDataUrl && (
                            <div className="relative">
                              <img
                                src={s.imageDataUrl}
                                alt="bag"
                                className="h-16 w-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => updateStop(s.id, "imageDataUrl", "")}
                                aria-label="إزالة الصورة"
                                className="absolute -top-2 -end-2 bg-red-500 text-white rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={resetForm}
              data-testid="btn-reset-route"
            >
              <FilePlus className="h-4 w-4 me-2" /> كشف جديد
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="btn-save-route"
            >
              <Save className="h-4 w-4 me-2" />
              {saveMutation.isPending
                ? "جاري الحفظ..."
                : currentId
                  ? "حفظ التعديلات"
                  : "حفظ الكشف"}
            </Button>
            <Button onClick={handlePrint} data-testid="btn-print-route">
              <Printer className="h-4 w-4 me-2" /> طباعة كشف A4
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الكشف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الكشف؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId !== null) {
                  deleteMutation.mutate(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden printable area */}
      <div style={{ display: "none" }}>
        <div ref={printArea} className="doc">
          <DocHeader
            logoUrl={logoUrl}
            title="كشف توصيل البضائع للعملاء"
            subtitle="Customer Delivery Route Sheet"
          />
          <div className="doc-meta">
            <div>
              <b>رقم الكشف:</b> {reference}
            </div>
            <div>
              <b>تاريخ التوصيل:</b> {date}
            </div>
            <div>
              <b>لوحة الشاحنة:</b> {vehiclePlate || "-"}
            </div>
            <div>
              <b>السائق:</b> {driver || "-"}
            </div>
            <div>
              <b>جوال السائق:</b> {driverPhone || "-"}
            </div>
            <div>
              <b>عدد العملاء:</b> {stops.filter((s) => s.customerId).length}
            </div>
          </div>

          <h2 className="section">مخطط توزيع البضاعة على الشاحنة</h2>
          <div style={{ border: "1px solid #999", padding: 8, borderRadius: 6, background: "#fafafa" }}>
            <TruckDiagram assignments={assignments} />
          </div>

          <h2 className="section">قائمة العملاء</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th style={{ width: 40 }}>الموقع</th>
                <th>العميل</th>
                <th>رقم التواصل</th>
                <th>المسؤول</th>
                <th>صورة</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, background: ZONE_COLORS[i % ZONE_COLORS.length] }}>
                    {s.zone}
                  </td>
                  <td>{s.customerName || "-"}</td>
                  <td style={{ direction: "ltr", textAlign: "start" }}>{s.contactPhone || "-"}</td>
                  <td>{s.inChargeName || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    {s.imageDataUrl ? (
                      <img
                        src={s.imageDataUrl}
                        alt=""
                        style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid #999" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{s.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <SignatureBlock
            labels={[
              { label: "السائق", name: driver },
              { label: "مسؤول التوصيل" },
              { label: "اعتماد الإدارة" },
            ]}
          />
          <div className="footer">
            صادر من نظام MPBF • {date} • هذا الكشف لتنظيم خط سير التوصيل فقط
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================== Page Root ===============================
export default function AdminToolsPage() {
  const { t } = useTranslation();
  const { logoUrl } = useCompanyLogo();
  const [tab, setTab] = useState<string>("delivery");

  return (
    <PageLayout
      title={t("adminTools.title", "الأدوات الإدارية")}
      description={t(
        "adminTools.description",
        "نماذج وقوالب جاهزة لتسريع الأعمال الإدارية اليومية",
      )}
    >
      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto w-full bg-muted p-1 gap-1">
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">تسليم وإخلاء مسؤولية</span>
            <span className="sm:hidden">تسليم</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">أمر إداري</span>
            <span className="sm:hidden">أمر</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">تقرير مخصص</span>
            <span className="sm:hidden">تقرير</span>
          </TabsTrigger>
          <TabsTrigger value="meeting" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            <span className="hidden sm:inline">محضر اجتماع</span>
            <span className="sm:hidden">اجتماع</span>
          </TabsTrigger>
          <TabsTrigger value="handover" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">تسليم عهدة</span>
            <span className="sm:hidden">عهدة</span>
          </TabsTrigger>
          <TabsTrigger value="route" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">كشف توصيل</span>
            <span className="sm:hidden">توصيل</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="delivery" className="border-0 mt-4">
          <DeliveryDisclaimerTab logoUrl={logoUrl} />
        </TabsContent>
        <TabsContent value="order" className="border-0 mt-4">
          <AdminOrderTab logoUrl={logoUrl} />
        </TabsContent>
        <TabsContent value="report" className="border-0 mt-4">
          <CustomReportTab logoUrl={logoUrl} />
        </TabsContent>
        <TabsContent value="meeting" className="border-0 mt-4">
          <MeetingMinutesTab logoUrl={logoUrl} />
        </TabsContent>
        <TabsContent value="handover" className="border-0 mt-4">
          <AssetHandoverTab logoUrl={logoUrl} />
        </TabsContent>
        <TabsContent value="route" className="border-0 mt-4">
          <DeliveryRouteTab logoUrl={logoUrl} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
