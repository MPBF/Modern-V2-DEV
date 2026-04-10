import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageLayout from "../components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Plus, Trash2, ToggleLeft, ToggleRight, Key, ExternalLink, Shield, Plug } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function McpSettings() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/mcp/api-keys"],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/mcp/api-keys", { name });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.api_key);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/api-keys"] });
      toast({
        title: isAr ? "تم إنشاء المفتاح" : "API Key Created",
        description: isAr ? "احفظ المفتاح الآن - لن يظهر مرة أخرى!" : "Save the key now - it won't be shown again!",
      });
    },
    onError: () => {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل في إنشاء المفتاح" : "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mcp/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/api-keys"] });
      setDeleteId(null);
      toast({
        title: isAr ? "تم الحذف" : "Deleted",
        description: isAr ? "تم حذف المفتاح بنجاح" : "API key deleted",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/mcp/api-keys/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/api-keys"] });
    },
  });

  const mcpUrl = `${window.location.origin}/mcp`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: isAr ? "تم النسخ" : "Copied",
      description: isAr ? "تم نسخ النص" : "Text copied to clipboard",
    });
  };

  return (
    <PageLayout title={isAr ? "إعدادات MCP" : "MCP Settings"}>
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              {isAr ? "ربط مع ChatGPT عبر MCP" : "Connect with ChatGPT via MCP"}
            </CardTitle>
            <CardDescription>
              {isAr
                ? "اربط نظام المصنع مع ChatGPT للاستعلام عن بيانات الطلبات والإنتاج والمخزون مباشرة من المحادثة"
                : "Connect the factory system with ChatGPT to query orders, production, and inventory data directly from chat"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {isAr ? "خطوات الربط مع ChatGPT" : "Steps to connect with ChatGPT"}
              </h3>
              <ol className="text-sm space-y-2 list-decimal ps-5">
                <li>
                  {isAr
                    ? "أنشئ مفتاح API من القسم أدناه"
                    : "Create an API key from the section below"}
                </li>
                <li>
                  {isAr
                    ? 'افتح ChatGPT وانتقل إلى الإعدادات → "تطبيق جديد"'
                    : 'Open ChatGPT and go to Settings → "New App"'}
                </li>
                <li>
                  {isAr ? "أدخل البيانات التالية:" : "Enter the following details:"}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 bg-background p-2 rounded border">
                      <span className="text-xs font-medium text-muted-foreground min-w-[120px]">
                        {isAr ? "عنوان URL الخادم MCP:" : "MCP Server URL:"}
                      </span>
                      <code className="text-xs flex-1 break-all">{mcpUrl}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(mcpUrl)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 bg-background p-2 rounded border">
                      <span className="text-xs font-medium text-muted-foreground min-w-[120px]">
                        {isAr ? "المصادقة:" : "Authentication:"}
                      </span>
                      <code className="text-xs">API Key (Bearer Token)</code>
                    </div>
                  </div>
                </li>
                <li>
                  {isAr
                    ? 'في الإعدادات المتقدمة، اختر "API Key" وأدخل المفتاح الذي أنشأته'
                    : 'In advanced settings, choose "API Key" and enter the key you created'}
                </li>
                <li>
                  {isAr ? 'اضغط "إنشاء" لحفظ التطبيق' : 'Click "Create" to save the app'}
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                {isAr ? "الأدوات المتاحة لـ ChatGPT" : "Available Tools for ChatGPT"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {[
                  { name: "get_dashboard_stats", desc: isAr ? "إحصائيات المصنع" : "Factory stats" },
                  { name: "get_orders", desc: isAr ? "طلبات العملاء" : "Customer orders" },
                  { name: "get_production_status", desc: isAr ? "حالة الإنتاج" : "Production status" },
                  { name: "get_inventory", desc: isAr ? "المخزون" : "Inventory levels" },
                  { name: "get_machines_status", desc: isAr ? "حالة الماكينات" : "Machine status" },
                  { name: "get_maintenance_requests", desc: isAr ? "طلبات الصيانة" : "Maintenance requests" },
                  { name: "get_attendance_summary", desc: isAr ? "ملخص الحضور" : "Attendance summary" },
                  { name: "get_customers", desc: isAr ? "العملاء" : "Customers" },
                  { name: "get_quality_issues", desc: isAr ? "مشاكل الجودة" : "Quality issues" },
                  { name: "search_rolls", desc: isAr ? "بحث الرولات" : "Search rolls" },
                ].map((tool) => (
                  <div key={tool.name} className="text-xs py-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{tool.name}</Badge>
                    <span className="text-muted-foreground">{tool.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {isAr ? "مفاتيح API" : "API Keys"}
            </CardTitle>
            <CardDescription>
              {isAr
                ? "أنشئ مفاتيح API لتأمين الاتصال مع ChatGPT. كل مفتاح يظهر مرة واحدة فقط عند الإنشاء."
                : "Create API keys to secure the connection with ChatGPT. Each key is shown only once upon creation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={isAr ? "اسم المفتاح (مثال: ChatGPT الرئيسي)" : "Key name (e.g. Main ChatGPT)"}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newKeyName.trim()) {
                    createMutation.mutate(newKeyName.trim());
                  }
                }}
              />
              <Button
                onClick={() => createMutation.mutate(newKeyName.trim())}
                disabled={!newKeyName.trim() || createMutation.isPending}
              >
                <Plus className="h-4 w-4 me-1" />
                {isAr ? "إنشاء" : "Create"}
              </Button>
            </div>

            {generatedKey && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  {isAr ? "🔑 مفتاح API الجديد (انسخه الآن):" : "🔑 New API Key (copy it now):"}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-green-100 dark:bg-green-900 p-2 rounded flex-1 break-all select-all">
                    {generatedKey}
                  </code>
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {isAr
                    ? "⚠️ هذا المفتاح لن يظهر مرة أخرى. احفظه في مكان آمن."
                    : "⚠️ This key won't be shown again. Save it in a safe place."}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {isAr ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                {isAr ? "لا توجد مفاتيح API بعد" : "No API keys yet"}
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{key.name}</span>
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active
                            ? isAr ? "نشط" : "Active"
                            : isAr ? "معطل" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{key.key_prefix}...</span>
                        <span>
                          {isAr ? "أُنشئ: " : "Created: "}
                          {new Date(key.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                        </span>
                        {key.last_used_at && (
                          <span>
                            {isAr ? "آخر استخدام: " : "Last used: "}
                            {new Date(key.last_used_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleMutation.mutate(key.id)}
                        title={key.is_active ? (isAr ? "تعطيل" : "Disable") : (isAr ? "تفعيل" : "Enable")}
                      >
                        {key.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف المفتاح" : "Delete API Key"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "هل أنت متأكد من حذف هذا المفتاح؟ سيتوقف أي تطبيق يستخدمه عن العمل."
                : "Are you sure you want to delete this key? Any app using it will stop working."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
