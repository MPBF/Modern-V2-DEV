import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  FileSignature,
  FileText,
  Plus,
  Printer,
  Trash2,
  Users2,
  Package,
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
import { useAuth } from "../hooks/use-auth";
import { useCompanyLogo } from "../hooks/use-company-logo";
import { useToast } from "../hooks/use-toast";

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
  const w = window.open("", "_blank", "width=900,height=1100,noopener=no");
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
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto w-full bg-muted p-1 gap-1">
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
      </Tabs>
    </PageLayout>
  );
}
