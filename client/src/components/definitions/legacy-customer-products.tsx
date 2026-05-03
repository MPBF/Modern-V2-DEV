import { useQuery } from "@tanstack/react-query";
import { Database, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

interface LegacyRow {
  id: number;
  customer_id: string | null;
  category_id: string | null;
  item_id: string | null;
  size_caption: string | null;
  width: string | number | null;
  left_f: string | number | null;
  right_f: string | number | null;
  thickness: string | number | null;
  thickness_one: string | number | null;
  printing_cylinder: string | null;
  length_cm: string | number | null;
  cutting_length_cm: string | number | null;
  raw_material: string | null;
  master_batch_id: string | null;
  printed: string | null;
  cutting_unit: string | null;
  unit_weight_kg: string | number | null;
  packing: string | null;
  punching: string | null;
  cover: string | null;
  volum: string | number | null;
  knife: string | null;
  notes: string | null;
  unit_qty: string | number | null;
  package_kg: string | number | null;
}

interface LegacyResponse {
  rows: LegacyRow[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 50;

const COLUMNS: Array<{ key: keyof LegacyRow; ar: string; en: string }> = [
  { key: "id", ar: "المعرف", en: "ID" },
  { key: "customer_id", ar: "العميل", en: "Customer" },
  { key: "category_id", ar: "الفئة", en: "Category" },
  { key: "item_id", ar: "الصنف", en: "Item" },
  { key: "size_caption", ar: "المقاس", en: "Size" },
  { key: "width", ar: "العرض", en: "Width" },
  { key: "left_f", ar: "يسار", en: "Left" },
  { key: "right_f", ar: "يمين", en: "Right" },
  { key: "thickness", ar: "السماكة", en: "Thickness" },
  { key: "thickness_one", ar: "سماكة 1", en: "Thickness 1" },
  { key: "printing_cylinder", ar: "أسطوانة الطباعة", en: "Cylinder" },
  { key: "length_cm", ar: "الطول (سم)", en: "Length (cm)" },
  { key: "cutting_length_cm", ar: "طول القطع (سم)", en: "Cut Len (cm)" },
  { key: "raw_material", ar: "المادة الخام", en: "Raw Material" },
  { key: "master_batch_id", ar: "ماستر باتش", en: "Master Batch" },
  { key: "printed", ar: "مطبوع", en: "Printed" },
  { key: "cutting_unit", ar: "وحدة القطع", en: "Cut Unit" },
  { key: "unit_weight_kg", ar: "وزن الوحدة (كغ)", en: "Unit Wt (kg)" },
  { key: "packing", ar: "التعبئة", en: "Packing" },
  { key: "punching", ar: "التخريم", en: "Punching" },
  { key: "cover", ar: "الغطاء", en: "Cover" },
  { key: "volum", ar: "الحجم", en: "Volume" },
  { key: "knife", ar: "السكين", en: "Knife" },
  { key: "unit_qty", ar: "كمية الوحدة", en: "Unit Qty" },
  { key: "package_kg", ar: "وزن العبوة (كغ)", en: "Pkg (kg)" },
  { key: "notes", ar: "ملاحظات", en: "Notes" },
];

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function formatCell(v: any): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

export default function LegacyCustomerProductsTab() {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const offset = page * PAGE_SIZE;
  const { data, isLoading, error, isFetching } = useQuery<LegacyResponse>({
    queryKey: [
      "/api/legacy/customer-products",
      { q: debouncedSearch, limit: PAGE_SIZE, offset },
    ],
    retry: false,
  });

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const errStatus = (error as any)?.status as number | undefined;
  const notConfigured = errStatus === 503;

  const titleAr = "القاعدة القديمة (للعرض فقط)";
  const titleEn = "Legacy Database (read-only)";

  const headerLabel = (c: { ar: string; en: string }) =>
    isAr ? `${c.ar}` : `${c.en}`;

  const subLabel = (c: { ar: string; en: string }) =>
    isAr ? c.en : c.ar;

  return (
    <Card dir={isAr ? "rtl" : "ltr"}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <span>{isAr ? titleAr : titleEn}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" data-testid="legacy-total-badge">
              {isAr ? `الإجمالي: ${total}` : `Total: ${total}`}
            </Badge>
          </div>
        </div>
        <div className="relative mt-3">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 ${isAr ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isAr
                ? "ابحث في كل الحقول النصية..."
                : "Search across all text fields..."
            }
            className={isAr ? "pr-9" : "pl-9"}
            data-testid="legacy-search-input"
          />
        </div>
      </CardHeader>
      <CardContent>
        {notConfigured ? (
          <div
            className="text-center py-10 text-muted-foreground"
            data-testid="legacy-not-configured"
          >
            <p className="font-medium">
              {isAr
                ? "قاعدة البيانات القديمة غير مهيأة"
                : "Legacy database is not configured"}
            </p>
            <p className="mt-2 text-sm">
              {isAr
                ? "يرجى إضافة السر LEGACY_DATABASE_URL لتفعيل هذا التبويب."
                : "Please add the LEGACY_DATABASE_URL secret to enable this tab."}
            </p>
          </div>
        ) : error ? (
          <div
            className="text-center py-10 text-red-600"
            data-testid="legacy-error"
          >
            {isAr
              ? "تعذر تحميل البيانات. حاول مرة أخرى."
              : "Failed to load data. Please try again."}
            <div className="mt-2 text-xs text-muted-foreground">
              {(error as any)?.message || ""}
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th
                        key={String(c.key)}
                        className="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap"
                      >
                        <div>{headerLabel(c)}</div>
                        <div className="text-[10px] opacity-70">
                          {subLabel(c)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="px-3 py-8 text-center text-muted-foreground"
                        data-testid="legacy-empty"
                      >
                        {isAr ? "لا توجد نتائج" : "No results"}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-muted/30"
                        data-testid={`legacy-row-${row.id}`}
                      >
                        {COLUMNS.map((c) => (
                          <td
                            key={String(c.key)}
                            className="px-3 py-2 text-center whitespace-nowrap text-foreground"
                          >
                            {formatCell((row as any)[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="text-xs text-muted-foreground">
                {isAr
                  ? `عرض ${rows.length === 0 ? 0 : offset + 1}-${offset + rows.length} من ${total}`
                  : `Showing ${rows.length === 0 ? 0 : offset + 1}-${offset + rows.length} of ${total}`}
                {isFetching && (
                  <span className="ml-2 opacity-70">
                    {isAr ? "(تحديث...)" : "(refreshing...)"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  data-testid="legacy-prev-page"
                >
                  {isAr ? (
                    <>
                      <ChevronRight className="w-4 h-4 ml-1" />
                      السابق
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Prev
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {isAr
                    ? `صفحة ${page + 1} / ${totalPages}`
                    : `Page ${page + 1} / ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="legacy-next-page"
                >
                  {isAr ? (
                    <>
                      التالي
                      <ChevronLeft className="w-4 h-4 mr-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
