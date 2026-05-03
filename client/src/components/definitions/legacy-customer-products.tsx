import { useQuery } from "@tanstack/react-query";
import { Database, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface LegacyRow {
  id: number;
  customer_name: string | null;
  customer_name_ar: string | null;
  category_name: string | null;
  category_name_ar: string | null;
  item_name: string | null;
  item_full_name: string | null;
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
  master_batch_name: string | null;
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

type ColumnDef = {
  key: string;
  ar: string;
  en: string;
  render: (row: LegacyRow) => React.ReactNode;
};

function bilingualCell(ar: string | null, en: string | null): React.ReactNode {
  if (!ar && !en) return "-";
  if (ar && en && ar !== en) {
    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{ar}</span>
        <span className="text-[10px] opacity-70">{en}</span>
      </div>
    );
  }
  return ar || en;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "customer",
    ar: "العميل",
    en: "Customer",
    render: (r) => bilingualCell(r.customer_name_ar, r.customer_name),
  },
  {
    key: "category",
    ar: "الفئة",
    en: "Category",
    render: (r) => bilingualCell(r.category_name_ar, r.category_name),
  },
  {
    key: "item",
    ar: "الصنف",
    en: "Item",
    render: (r) => formatCell(r.item_full_name || r.item_name),
  },
  {
    key: "size_caption",
    ar: "المقاس",
    en: "Size",
    render: (r) => formatCell(r.size_caption),
  },
  { key: "width", ar: "العرض", en: "Width", render: (r) => formatCell(r.width) },
  { key: "left_f", ar: "يسار", en: "Left", render: (r) => formatCell(r.left_f) },
  { key: "right_f", ar: "يمين", en: "Right", render: (r) => formatCell(r.right_f) },
  { key: "thickness", ar: "السماكة", en: "Thickness", render: (r) => formatCell(r.thickness) },
  { key: "thickness_one", ar: "سماكة 1", en: "Thickness 1", render: (r) => formatCell(r.thickness_one) },
  { key: "printing_cylinder", ar: "أسطوانة الطباعة", en: "Cylinder", render: (r) => formatCell(r.printing_cylinder) },
  { key: "length_cm", ar: "الطول (سم)", en: "Length (cm)", render: (r) => formatCell(r.length_cm) },
  { key: "cutting_length_cm", ar: "طول القطع (سم)", en: "Cut Len (cm)", render: (r) => formatCell(r.cutting_length_cm) },
  { key: "raw_material", ar: "المادة الخام", en: "Raw Material", render: (r) => formatCell(r.raw_material) },
  {
    key: "master_batch",
    ar: "ماستر باتش",
    en: "Master Batch",
    render: (r) => formatCell(r.master_batch_name),
  },
  { key: "printed", ar: "مطبوع", en: "Printed", render: (r) => formatCell(r.printed) },
  { key: "cutting_unit", ar: "وحدة القطع", en: "Cut Unit", render: (r) => formatCell(r.cutting_unit) },
  { key: "unit_weight_kg", ar: "وزن الوحدة (كغ)", en: "Unit Wt (kg)", render: (r) => formatCell(r.unit_weight_kg) },
  { key: "packing", ar: "التعبئة", en: "Packing", render: (r) => formatCell(r.packing) },
  { key: "punching", ar: "التخريم", en: "Punching", render: (r) => formatCell(r.punching) },
  { key: "cover", ar: "الغطاء", en: "Cover", render: (r) => formatCell(r.cover) },
  { key: "volum", ar: "الحجم", en: "Volume", render: (r) => formatCell(r.volum) },
  { key: "knife", ar: "السكين", en: "Knife", render: (r) => formatCell(r.knife) },
  { key: "unit_qty", ar: "كمية الوحدة", en: "Unit Qty", render: (r) => formatCell(r.unit_qty) },
  { key: "package_kg", ar: "وزن العبوة (كغ)", en: "Pkg (kg)", render: (r) => formatCell(r.package_kg) },
  { key: "notes", ar: "ملاحظات", en: "Notes", render: (r) => formatCell(r.notes) },
];

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type LegacyCellValue = LegacyRow[keyof LegacyRow];

function formatCell(v: LegacyCellValue): string {
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

  const errStatus =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  const notConfigured = errStatus === 503;
  const errorMessage =
    error instanceof Error ? error.message : "";

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
              {errorMessage}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((c) => (
                      <TableHead
                        key={String(c.key)}
                        className="text-center whitespace-nowrap"
                      >
                        <div>{headerLabel(c)}</div>
                        <div className="text-[10px] opacity-70 font-normal">
                          {subLabel(c)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        {COLUMNS.map((c) => (
                          <TableCell
                            key={String(c.key)}
                            className="text-center"
                          >
                            <Skeleton className="h-4 w-full mx-auto" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={COLUMNS.length}
                        className="py-8 text-center text-muted-foreground"
                        data-testid="legacy-empty"
                      >
                        {isAr ? "لا توجد نتائج" : "No results"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-testid={`legacy-row-${row.id}`}
                      >
                        {COLUMNS.map((c) => (
                          <TableCell
                            key={String(c.key)}
                            className="text-center whitespace-nowrap"
                          >
                            {c.render(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
