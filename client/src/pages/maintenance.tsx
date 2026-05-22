import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Plus,
  FileText,
  AlertCircle,
  Users,
  Eye,
  Printer,
  Edit,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  generateActionNumber,
  generateMaintenanceReportNumber,
  generateOperatorReportNumber,
} from "../../../shared/id-generator";
import PageLayout from "../components/layout/PageLayout";
import ConsumablePartsTab from "../components/maintenance/ConsumablePartsTab";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  canAddInArea,
  canDeleteInArea,
  canEditInArea,
  userHasPermission,
} from "../utils/roleUtils";

import type { PermissionKey } from "../../../shared/permissions";
import type { TFunction } from "i18next";

const createMaintenanceActionSchema = (t: TFunction) =>
  z.object({
    maintenance_request_id: z.number(),
    action_type: z
      .string()
      .min(1, t("maintenance.validation.actionTypeRequired")),
    description: z
      .string()
      .min(1, t("maintenance.validation.descriptionRequired")),
    text_report: z.string().optional(),
    spare_parts_request: z.string().optional(),
    machining_request: z.string().optional(),
    operator_negligence_report: z.string().optional(),
    performed_by: z
      .string()
      .min(1, t("maintenance.validation.performerRequired")),
    requires_management_action: z.boolean().optional(),
    management_notified: z.boolean().optional(),
  });

const createMaintenanceReportSchema = (t: TFunction) =>
  z.object({
    report_type: z
      .string()
      .min(1, t("maintenance.validation.reportTypeRequired")),
    title: z.string().min(1, t("maintenance.validation.titleRequired")),
    description: z
      .string()
      .min(1, t("maintenance.validation.descriptionRequired")),
    machine_id: z.string().optional(),
    severity: z.string().default("medium"),
    priority: z.string().default("medium"),
    spare_parts_needed: z.array(z.string()).optional(),
    estimated_repair_time: z.number().optional(),
  });

const createOperatorNegligenceSchema = (t: TFunction) =>
  z.object({
    operator_id: z
      .string()
      .min(1, t("maintenance.validation.operatorIdRequired")),
    operator_name: z
      .string()
      .min(1, t("maintenance.validation.operatorNameRequired")),
    incident_date: z
      .string()
      .min(1, t("maintenance.validation.incidentDateRequired")),
    incident_type: z
      .string()
      .min(1, t("maintenance.validation.incidentTypeRequired")),
    description: z
      .string()
      .min(1, t("maintenance.validation.descriptionRequired")),
    severity: z.string().default("medium"),
    witnesses: z.array(z.string()).optional(),
    immediate_actions_taken: z.string().optional(),
  });

const createMaintenanceRequestSchema = (t: TFunction) =>
  z.object({
    machine_id: z
      .string()
      .min(1, t("maintenance.validation.equipmentRequired")),
    issue_type: z
      .string()
      .min(1, t("maintenance.validation.issueTypeRequired")),
    urgency_level: z.string().default("normal"),
    description: z
      .string()
      .min(1, t("maintenance.validation.descriptionRequired")),
    assigned_to: z.string().optional(),
  });

const maintenanceTabPermissions: {
  tab: string;
  permissions: PermissionKey[];
}[] = [
  {
    tab: "requests",
    permissions: [
      "view_maintenance_requests",
      "view_maintenance",
      "manage_maintenance",
    ],
  },
  {
    tab: "actions",
    permissions: ["manage_maintenance_actions", "manage_maintenance"],
  },
  {
    tab: "reports",
    permissions: [
      "view_maintenance_reports",
      "view_maintenance",
      "manage_maintenance",
    ],
  },
  {
    tab: "negligence",
    permissions: ["manage_negligence", "manage_maintenance"],
  },
  {
    tab: "spare-parts",
    permissions: ["manage_spare_parts", "manage_maintenance"],
  },
  {
    tab: "consumable-parts",
    permissions: ["manage_consumable_parts", "manage_maintenance"],
  },
];

export default function Maintenance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canAddMaint = canAddInArea(user, "maintenance");
  const [currentTab, setCurrentTab] = useState(
    maintenanceTabPermissions.find((tp) =>
      userHasPermission(user, tp.permissions),
    )?.tab || "requests",
  );
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isActionViewDialogOpen, setIsActionViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: maintenanceRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/maintenance-requests"],
  });

  const { data: maintenanceActions, isLoading: loadingActions } = useQuery({
    queryKey: ["/api/maintenance-actions"],
  });

  const { data: maintenanceReports, isLoading: loadingReports } = useQuery({
    queryKey: ["/api/maintenance-reports"],
  });

  const { data: operatorReports, isLoading: loadingOperatorReports } = useQuery(
    {
      queryKey: ["/api/operator-negligence-reports"],
    },
  );

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: spareParts } = useQuery({
    queryKey: ["/api/spare-parts"],
  });

  const createActionMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Sending maintenance action data:", data);
      return apiRequest("/api/maintenance-actions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      console.log("Maintenance action created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-actions"] });
      toast({ title: t("maintenance.toast.actionCreated") });
    },
    onError: (error) => {
      console.error("Failed to create maintenance action:", error);
      toast({
        title: t("maintenance.toast.actionCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/maintenance-reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-reports"] });
      toast({ title: t("maintenance.toast.reportCreated") });
    },
    onError: () => {
      toast({
        title: t("maintenance.toast.reportCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const createOperatorReportMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/operator-negligence-reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/operator-negligence-reports"],
      });
      toast({ title: t("maintenance.toast.negligenceCreated") });
    },
    onError: () => {
      toast({
        title: t("maintenance.toast.negligenceCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => {
      const requestData = {
        ...data,
        reported_by: user?.id?.toString() || "",
      };
      return apiRequest("/api/maintenance-requests", {
        method: "POST",
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/maintenance-requests"],
      });
      setIsRequestDialogOpen(false);
      toast({ title: t("maintenance.toast.requestCreated") });
    },
    onError: (error) => {
      console.error("Error creating maintenance request:", error);
      toast({
        title: t("maintenance.toast.requestCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t("maintenance.status.pending");
      case "in_progress":
        return t("maintenance.status.inProgress");
      case "completed":
        return t("maintenance.status.completed");
      case "cancelled":
        return t("maintenance.status.cancelled");
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("maintenance.priority.high");
      case "medium":
        return t("maintenance.priority.medium");
      case "low":
        return t("maintenance.priority.low");
      default:
        return priority;
    }
  };

  return (
    <PageLayout
      title={t("maintenance.title")}
      description={t("maintenance.maintenanceType")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenance.totalRequests")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(maintenanceRequests)
                    ? maintenanceRequests.length
                    : 0}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenance.status.pending")}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Array.isArray(maintenanceRequests)
                    ? maintenanceRequests.filter(
                        (r: any) => r.status === "pending",
                      ).length
                    : 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenance.status.inProgress")}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray(maintenanceRequests)
                    ? maintenanceRequests.filter(
                        (r: any) => r.status === "in_progress",
                      ).length
                    : 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("maintenance.status.completedFeminine")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(maintenanceRequests)
                    ? maintenanceRequests.filter(
                        (r: any) => r.status === "completed",
                      ).length
                    : 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
          {userHasPermission(user, [
            "view_maintenance_requests",
            "view_maintenance",
            "manage_maintenance",
          ]) && (
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {t("maintenance.tabs.requests")}
            </TabsTrigger>
          )}
          {userHasPermission(user, [
            "manage_maintenance_actions",
            "manage_maintenance",
          ]) && (
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t("maintenance.tabs.actions")}
            </TabsTrigger>
          )}
          {userHasPermission(user, [
            "view_maintenance_reports",
            "view_maintenance",
            "manage_maintenance",
          ]) && (
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("maintenance.tabs.reports")}
            </TabsTrigger>
          )}
          {userHasPermission(user, [
            "manage_negligence",
            "manage_maintenance",
          ]) && (
            <TabsTrigger value="negligence" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t("maintenance.tabs.negligence")}
            </TabsTrigger>
          )}
          {userHasPermission(user, [
            "manage_spare_parts",
            "manage_maintenance",
          ]) && (
            <TabsTrigger
              value="spare-parts"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t("maintenance.tabs.spareParts")}
            </TabsTrigger>
          )}
          {userHasPermission(user, [
            "manage_consumable_parts",
            "manage_maintenance",
          ]) && (
            <TabsTrigger
              value="consumable-parts"
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              {t("maintenance.tabs.consumableParts")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("maintenance.tabs.requests")}</CardTitle>
                <Dialog
                  open={isRequestDialogOpen}
                  onOpenChange={setIsRequestDialogOpen}
                >
                  {canAddMaint && (
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("maintenance.newRequest")}
                    </Button>
                  </DialogTrigger>
                  )}
                  <MaintenanceRequestDialog
                    machines={machines}
                    users={users}
                    onSubmit={createRequestMutation.mutate}
                    isLoading={createRequestMutation.isPending}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.requestNumber")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.machineName")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.maintenanceType")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.urgencyLevel")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("common.status")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.issueDescription")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("maintenance.technician")}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {t("common.date")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(maintenanceRequests) &&
                      maintenanceRequests.length > 0 ? (
                        maintenanceRequests.map((request: any) => {
                          const machine = Array.isArray(machines)
                            ? machines.find(
                                (m: any) => m.id === request.machine_id,
                              )
                            : null;
                          const machineName = machine
                            ? machine.name_ar || machine.name
                            : request.machine_id;

                          const assignedUser =
                            Array.isArray(users) && request.assigned_to
                              ? users.find(
                                  (u: any) =>
                                    u.id.toString() ===
                                    request.assigned_to.toString(),
                                )
                              : null;
                          const assignedName = assignedUser
                            ? assignedUser.full_name || assignedUser.username
                            : t("maintenance.notAssigned");

                          return (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                {request.request_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {machineName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {request.issue_type === "mechanical"
                                  ? t("maintenance.issueType.mechanical")
                                  : request.issue_type === "electrical"
                                    ? t("maintenance.issueType.electrical")
                                    : t("maintenance.issueType.other")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Badge
                                  variant={
                                    request.urgency_level === "urgent"
                                      ? "destructive"
                                      : request.urgency_level === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {request.urgency_level === "urgent"
                                    ? t("maintenance.urgency.urgent")
                                    : request.urgency_level === "medium"
                                      ? t("maintenance.urgency.medium")
                                      : t("maintenance.urgency.normal")}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                                >
                                  {getStatusText(request.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate text-center">
                                {request.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {assignedName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {new Date(
                                  request.date_reported,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            {t("maintenance.noRequests")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <MaintenanceActionsTab
            actions={maintenanceActions}
            requests={maintenanceRequests}
            users={users}
            isLoading={loadingActions}
            onCreateAction={createActionMutation.mutate}
            onViewAction={(action: any) => {
              setSelectedAction(action);
              setIsActionViewDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="reports">
          <MaintenanceReportsTab
            reports={maintenanceReports}
            machines={machines}
            users={users}
            isLoading={loadingReports}
            onCreateReport={createReportMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="negligence">
          <OperatorNegligenceTab
            reports={operatorReports}
            users={users}
            isLoading={loadingOperatorReports}
            onCreateReport={createOperatorReportMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="spare-parts">
          <SparePartsTab
            spareParts={Array.isArray(spareParts) ? spareParts : []}
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="consumable-parts">
          <ConsumablePartsTab />
        </TabsContent>
      </Tabs>

      <Dialog
        open={isActionViewDialogOpen}
        onOpenChange={setIsActionViewDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("maintenance.actionDetails")}</DialogTitle>
            <DialogDescription>
              {t("maintenance.actionDetailsDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedAction &&
            (() => {
              const performedByUser = Array.isArray(users)
                ? users.find(
                    (u: any) => u.id.toString() === selectedAction.performed_by,
                  )
                : null;
              const maintenanceRequest = Array.isArray(maintenanceRequests)
                ? maintenanceRequests.find(
                    (r: any) => r.id === selectedAction.maintenance_request_id,
                  )
                : null;

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.actionNumber")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 p-2 rounded">
                        {selectedAction.action_number}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.maintenanceRequestNumber")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 p-2 rounded">
                        {maintenanceRequest?.request_number ||
                          selectedAction.maintenance_request_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.actionType")}
                      </label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-sm">
                          {selectedAction.action_type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.performer")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {performedByUser
                          ? performedByUser.display_name_ar ||
                            performedByUser.display_name ||
                            performedByUser.username
                          : selectedAction.performed_by}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("maintenance.actionDescription")}
                    </label>
                    <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded min-h-[60px]">
                      {selectedAction.description ||
                        t("maintenance.noDescription")}
                    </p>
                  </div>

                  {selectedAction.text_report && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.textReport")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-blue-50 p-3 rounded min-h-[60px] border border-blue-200">
                        {selectedAction.text_report}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.sparePartsRequest")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {selectedAction.spare_parts_request ||
                          t("maintenance.none")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.machiningRequest")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {selectedAction.machining_request ||
                          t("maintenance.none")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.requiresManagementAction")}
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedAction.requires_management_action
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedAction.requires_management_action
                            ? t("maintenance.yes")
                            : t("maintenance.no")}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.managementNotified")}
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedAction.management_notified
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedAction.management_notified
                            ? t("maintenance.yes")
                            : t("maintenance.no")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.executionDate")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {selectedAction.performed_at
                          ? new Date(
                              selectedAction.performed_at,
                            ).toLocaleDateString("en-US")
                          : t("maintenance.notAssigned")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.creationDate")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {selectedAction.created_at
                          ? new Date(
                              selectedAction.created_at,
                            ).toLocaleDateString("en-US")
                          : t("maintenance.notAssigned")}
                      </p>
                    </div>
                  </div>

                  {maintenanceRequest && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("maintenance.machineInfo")}
                      </label>
                      <div className="mt-1 bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm">
                          <strong>{t("maintenance.machineId")}:</strong>{" "}
                          {maintenanceRequest.machine_id}
                        </p>
                        <p className="text-sm">
                          <strong>{t("maintenance.issueTypeLabel")}:</strong>{" "}
                          {maintenanceRequest.issue_type}
                        </p>
                        <p className="text-sm">
                          <strong>{t("maintenance.priorityLevel")}:</strong>{" "}
                          {maintenanceRequest.urgency_level}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function MaintenanceActionsTab({
  actions,
  requests,
  users,
  isLoading,
  onCreateAction,
  onViewAction,
}: any) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: spareParts } = useQuery({ queryKey: ["/api/spare-parts"] });
  const { user } = useAuth();
  const canAddMaint = canAddInArea(user, "maintenance");
  const canEditMaint = canEditInArea(user, "maintenance");
  const canDeleteMaint = canDeleteInArea(user, "maintenance");

  const maintenanceActionSchema = createMaintenanceActionSchema(t);

  const form = useForm({
    resolver: zodResolver(maintenanceActionSchema),
    defaultValues: {
      maintenance_request_id: 0,
      action_type: "",
      description: "",
      text_report: "",
      spare_parts_request: "",
      machining_request: "",
      operator_negligence_report: "",
      performed_by: "",
      requires_management_action: false,
      management_notified: false,
    },
  });

  useEffect(() => {
    if (user?.id) {
      form.setValue("performed_by", user.id.toString());
    }
  }, [user?.id, form]);

  const onSubmit = async (data: any) => {
    try {
      console.log("Form data submitted:", data);

      const actionNumber = generateActionNumber();

      const submitData = {
        ...data,
        action_number: actionNumber,
        request_created_by: user?.id?.toString() || "",
      };

      console.log("Submitting action data:", submitData);
      await onCreateAction(submitData);

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating maintenance action:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("maintenance.tabs.actions")}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {canAddMaint && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                {t("maintenance.addNewAction")}
              </Button>
            </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {t("maintenance.addActionDialogTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("maintenance.addActionDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maintenance_request_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.maintenanceRequest")}
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "maintenance.selectMaintenanceRequest",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(requests) &&
                                requests.map((request: any) => (
                                  <SelectItem
                                    key={request.id}
                                    value={request.id.toString()}
                                  >
                                    {request.request_number} -{" "}
                                    {request.description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="action_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.actionType")}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "maintenance.selectActionType",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="فحص مبدئي">
                                {t("maintenance.actionTypes.initialInspection")}
                              </SelectItem>
                              <SelectItem value="تغيير قطعة غيار">
                                {t("maintenance.actionTypes.sparePartChange")}
                              </SelectItem>
                              <SelectItem value="إصلاح مكانيكي">
                                {t("maintenance.actionTypes.mechanicalRepair")}
                              </SelectItem>
                              <SelectItem value="إصلاح كهربائي">
                                {t("maintenance.actionTypes.electricalRepair")}
                              </SelectItem>
                              <SelectItem value="إيقاف الماكينة">
                                {t("maintenance.actionTypes.machineShutdown")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="performed_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.performer")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={user?.id ? user.id.toString() : ""}
                            type="hidden"
                            className="hidden"
                          />
                        </FormControl>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border">
                          <div className="font-medium text-sm">
                            {user
                              ? `${user.display_name || user.username} (${user.id})`
                              : t("common.loading")}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {t("maintenance.actionRegisteredAsCurrentUser")}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("maintenance.actionDescription")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t(
                              "maintenance.actionDescriptionPlaceholder",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="text_report"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.textReport")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t(
                                "maintenance.textReportPlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="spare_parts_request"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.sparePartsRequest")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("maintenance.selectSparePart")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(spareParts) &&
                                spareParts.length > 0 ? (
                                  spareParts
                                    .filter(
                                      (part) =>
                                        part.part_id &&
                                        part.part_name &&
                                        part.code,
                                    )
                                    .map((part: any) => (
                                      <SelectItem
                                        key={part.part_id}
                                        value={`${part.part_name}_${part.code}_${part.part_id}`}
                                      >
                                        {part.part_name} ({part.code}) -{" "}
                                        {part.machine_name}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <SelectItem value="no_parts">
                                    {t("maintenance.noSparePartsAvailable")}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="machining_request"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.machiningRequest")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t(
                                "maintenance.machiningRequestPlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="operator_negligence_report"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.operatorNegligenceReport")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t(
                                "maintenance.operatorNegligencePlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requires_management_action"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {t("maintenance.needsManagementApproval")}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="management_notified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {t("maintenance.managementNotifiedLabel")}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit">{t("maintenance.saveAction")}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          </div>
        ) : Array.isArray(actions) && actions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.actionNumber")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.maintenanceRequestNumber")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.actionType")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.description")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.performer")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.sparePartsRequest")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.machiningRequest")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.managementApproval")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("maintenance.executionDate")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action: any) => {
                  const performedByUser = Array.isArray(users)
                    ? users.find(
                        (u: any) => u.id.toString() === action.performed_by,
                      )
                    : null;
                  const maintenanceRequest = Array.isArray(requests)
                    ? requests.find(
                        (r: any) => r.id === action.maintenance_request_id,
                      )
                    : null;

                  const handleView = () => {
                    onViewAction?.(action);
                  };

                  const handlePrint = () => {
                    const printContent = `
                      <div style="font-family: Arial; direction: rtl; text-align: right; padding: 20px;">
                        <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
                          ${t("maintenance.printActionTitle")}: ${action.action_number}
                        </h2>
                        <div style="margin: 20px 0;">
                          <p><strong>${t("maintenance.maintenanceRequestNumber")}:</strong> ${maintenanceRequest?.request_number || action.maintenance_request_id}</p>
                          <p><strong>${t("maintenance.actionType")}:</strong> ${action.action_type}</p>
                          <p><strong>${t("maintenance.description")}:</strong> ${action.description || "-"}</p>
                          <p><strong>${t("maintenance.performer")}:</strong> ${performedByUser ? performedByUser.full_name || performedByUser.username : action.performed_by}</p>
                          <p><strong>${t("maintenance.sparePartsRequest")}:</strong> ${action.spare_parts_request || "-"}</p>
                          <p><strong>${t("maintenance.machiningRequest")}:</strong> ${action.machining_request || "-"}</p>
                          <p><strong>${t("maintenance.operatorNegligenceReport")}:</strong> ${action.operator_negligence_report || "-"}</p>
                          <p><strong>${t("maintenance.textReport")}:</strong> ${action.text_report || "-"}</p>
                          <p><strong>${t("maintenance.managementApprovalRequired")}:</strong> ${action.requires_management_action ? t("maintenance.yes") : t("maintenance.no")}</p>
                          <p><strong>${t("maintenance.executionDate")}:</strong> ${new Date(action.action_date).toLocaleDateString("en-US")}</p>
                          <p><strong>${t("maintenance.executionTime")}:</strong> ${new Date(action.action_date).toLocaleTimeString("en-US")}</p>
                        </div>
                      </div>
                    `;

                    const printWindow = window.open("", "_blank");
                    printWindow?.document.write(printContent);
                    printWindow?.document.close();
                    printWindow?.print();
                  };

                  const handleDelete = async () => {
                    if (
                      confirm(
                        t("maintenance.confirmDeleteAction", {
                          number: action.action_number,
                        }),
                      )
                    ) {
                      try {
                        const response = await fetch(
                          `/api/maintenance-actions/${action.id}`,
                          {
                            method: "DELETE",
                          },
                        );

                        if (!response.ok) {
                          const errorData = await response
                            .json()
                            .catch(() => null);
                          const errorMessage =
                            errorData?.message ||
                            t("maintenance.deleteActionError");
                          alert(errorMessage);
                          return;
                        }

                        window.location.reload();
                      } catch (error) {
                        console.error(
                          "Error deleting maintenance action:",
                          error,
                        );
                        alert(t("maintenance.connectionError"));
                      }
                    }
                  };

                  const handleEdit = () => {
                    alert(
                      t("maintenance.editActionComingSoon", {
                        number: action.action_number,
                      }),
                    );
                  };

                  return (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center font-medium text-blue-600">
                        {action.action_number}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-medium text-green-600">
                        {maintenanceRequest?.request_number ||
                          `MO${action.maintenance_request_id.toString().padStart(3, "0")}`}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {action.action_type}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {action.description || "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {performedByUser
                          ? performedByUser.full_name ||
                            performedByUser.username
                          : action.performed_by}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {action.spare_parts_request || "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {action.machining_request || "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {action.requires_management_action ? (
                          <Badge variant="destructive">
                            {t("maintenance.required")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("maintenance.notRequired")}
                          </Badge>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {new Date(action.action_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(action.action_date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 h-8 w-8 p-0"
                            onClick={handleView}
                            title={t("maintenance.view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200 h-8 w-8 p-0"
                            onClick={handlePrint}
                            title={t("maintenance.print")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {canEditMaint && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200 h-8 w-8 p-0"
                            onClick={handleEdit}
                            title={t("maintenance.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {canDeleteMaint && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 h-8 w-8 p-0"
                            onClick={handleDelete}
                            title={t("maintenance.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("maintenance.noActions")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaintenanceReportsTab({
  reports,
  machines,
  users,
  isLoading,
  onCreateReport,
}: any) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const canAddMaint = canAddInArea(user, "maintenance");

  const maintenanceReportSchema = createMaintenanceReportSchema(t);

  const form = useForm({
    resolver: zodResolver(maintenanceReportSchema),
    defaultValues: {
      report_type: "",
      title: "",
      description: "",
      machine_id: "",
      severity: "medium",
      priority: "medium",
      spare_parts_needed: [],
      estimated_repair_time: 0,
    },
  });

  const onSubmit = async (data: any) => {
    if (!user?.id) {
      toast({
        title: t("maintenance.error"),
        description: t("maintenance.loginRequiredForReport"),
        variant: "destructive",
      });
      return;
    }

    try {
      const reportNumber = generateMaintenanceReportNumber();

      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: user.id,
        status: "open",
        estimated_repair_time: data.estimated_repair_time || null,
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating maintenance report:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("maintenance.tabs.reports")}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {canAddMaint && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                {t("maintenance.addNewReport")}
              </Button>
            </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {t("maintenance.addReportDialogTitle")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("maintenance.addReportDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="report_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.reportType")}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "maintenance.selectReportType",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakdown">
                                {t("maintenance.reportTypes.breakdown")}
                              </SelectItem>
                              <SelectItem value="malfunction">
                                {t("maintenance.reportTypes.malfunction")}
                              </SelectItem>
                              <SelectItem value="safety">
                                {t("maintenance.reportTypes.safety")}
                              </SelectItem>
                              <SelectItem value="quality">
                                {t("maintenance.reportTypes.quality")}
                              </SelectItem>
                              <SelectItem value="preventive">
                                {t("maintenance.reportTypes.preventive")}
                              </SelectItem>
                              <SelectItem value="spare_parts">
                                {t("maintenance.reportTypes.spareParts")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.severity")}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("maintenance.selectSeverity")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">
                                {t("maintenance.severity.low")}
                              </SelectItem>
                              <SelectItem value="medium">
                                {t("maintenance.severity.medium")}
                              </SelectItem>
                              <SelectItem value="high">
                                {t("maintenance.severity.high")}
                              </SelectItem>
                              <SelectItem value="critical">
                                {t("maintenance.severity.critical")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.reportTitle")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t(
                              "maintenance.reportTitlePlaceholder",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("maintenance.issueDescription")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t(
                              "maintenance.issueDescriptionPlaceholder",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="machine_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.machineOptional")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "maintenance.machineIdPlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_repair_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.estimatedRepairTime")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                      {t("maintenance.submitReport")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          </div>
        ) : Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {report.report_number} - {report.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        report.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {report.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">
                      {t("maintenance.reportType")}:{" "}
                    </span>
                    {report.report_type}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("maintenance.reportDate")}:{" "}
                    </span>
                    {new Date(report.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("maintenance.noReports")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OperatorNegligenceTab({
  reports,
  users,
  isLoading,
  onCreateReport,
}: any) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const canAddMaint = canAddInArea(user, "maintenance");

  const operatorNegligenceSchema = createOperatorNegligenceSchema(t);

  const form = useForm({
    resolver: zodResolver(operatorNegligenceSchema),
    defaultValues: {
      operator_id: "",
      operator_name: "",
      incident_date: "",
      incident_type: "",
      description: "",
      severity: "medium",
      witnesses: [],
      immediate_actions_taken: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!user?.id) {
      toast({
        title: t("maintenance.error"),
        description: t("maintenance.loginRequiredForNegligence"),
        variant: "destructive",
      });
      return;
    }

    try {
      const reportNumber = generateOperatorReportNumber();

      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: user.id,
        report_date: new Date().toISOString().split("T")[0],
        status: "pending",
        follow_up_required:
          data.severity === "high" || data.severity === "critical",
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating operator negligence report:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("maintenance.tabs.negligence")}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {canAddMaint && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                {t("maintenance.addNegligenceReport")}
              </Button>
            </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {t("maintenance.addNegligenceDialogTitle")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("maintenance.addNegligenceDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="operator_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.operatorId")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "maintenance.operatorIdPlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="operator_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.operatorName")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "maintenance.operatorNamePlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="incident_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.incidentDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incident_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.negligenceType")}
                          </FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "maintenance.selectNegligenceType",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="safety_violation">
                                {t(
                                  "maintenance.negligenceTypes.safetyViolation",
                                )}
                              </SelectItem>
                              <SelectItem value="equipment_misuse">
                                {t(
                                  "maintenance.negligenceTypes.equipmentMisuse",
                                )}
                              </SelectItem>
                              <SelectItem value="procedure_violation">
                                {t(
                                  "maintenance.negligenceTypes.procedureViolation",
                                )}
                              </SelectItem>
                              <SelectItem value="quality_negligence">
                                {t(
                                  "maintenance.negligenceTypes.qualityNegligence",
                                )}
                              </SelectItem>
                              <SelectItem value="time_violation">
                                {t("maintenance.negligenceTypes.timeViolation")}
                              </SelectItem>
                              <SelectItem value="maintenance_neglect">
                                {t(
                                  "maintenance.negligenceTypes.maintenanceNeglect",
                                )}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("maintenance.incidentDescription")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t(
                              "maintenance.incidentDescriptionPlaceholder",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.negligenceSeverity")}
                          </FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("maintenance.selectSeverity")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">
                                {t("maintenance.severity.low")}
                              </SelectItem>
                              <SelectItem value="medium">
                                {t("maintenance.severity.medium")}
                              </SelectItem>
                              <SelectItem value="high">
                                {t("maintenance.severity.high")}
                              </SelectItem>
                              <SelectItem value="critical">
                                {t("maintenance.severity.critical")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="immediate_actions_taken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("maintenance.immediateActions")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t(
                                "maintenance.immediateActionsPlaceholder",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                      {t("maintenance.submitReport")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          </div>
        ) : Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {report.report_number} - {report.operator_name}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        report.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {report.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">
                      {t("maintenance.negligenceType")}:{" "}
                    </span>
                    {report.incident_type}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("maintenance.incidentDate")}:{" "}
                    </span>
                    {new Date(report.incident_date).toLocaleDateString("en-US")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("maintenance.noNegligenceReports")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaintenanceRequestDialog({
  machines,
  users,
  onSubmit,
  isLoading,
}: any) {
  const { t } = useTranslation();
  const maintenanceRequestSchema = createMaintenanceRequestSchema(t);

  const form = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      machine_id: "",
      issue_type: "mechanical",
      urgency_level: "normal",
      description: "",
      assigned_to: "none",
    },
  });

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      assigned_to: data.assigned_to === "none" ? "" : data.assigned_to,
    };
    onSubmit(submitData);
    form.reset();
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{t("maintenance.newRequest")}</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          {t("maintenance.newRequestDescription")}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenance.equipment")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("maintenance.selectEquipment")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(machines) &&
                        machines
                          .filter(
                            (machine) =>
                              machine.id &&
                              machine.id !== "" &&
                              machine.id !== null &&
                              machine.id !== undefined,
                          )
                          .map((machine: any) => (
                            <SelectItem
                              key={machine.id}
                              value={machine.id.toString()}
                            >
                              {machine.name_ar}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issue_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenance.issueTypeLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("maintenance.selectIssueType")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mechanical">
                        {t("maintenance.issueType.mechanical")}
                      </SelectItem>
                      <SelectItem value="electrical">
                        {t("maintenance.issueType.electrical")}
                      </SelectItem>
                      <SelectItem value="other">
                        {t("maintenance.issueType.other")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="urgency_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenance.urgencyLevel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("maintenance.selectUrgencyLevel")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">
                        {t("maintenance.urgency.normal")}
                      </SelectItem>
                      <SelectItem value="medium">
                        {t("maintenance.urgency.medium")}
                      </SelectItem>
                      <SelectItem value="urgent">
                        {t("maintenance.urgency.urgent")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.assignedToOptional")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("maintenance.selectTechnician")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("maintenance.noAssignment")}
                    </SelectItem>
                    {Array.isArray(users) &&
                      users
                        .filter((user: any) => user.role === "technician")
                        .map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.full_name || user.username}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.issueDescription")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t(
                      "maintenance.issueDescriptionDetailPlaceholder",
                    )}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading
                ? t("maintenance.creating")
                : t("maintenance.createRequest")}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function SparePartsTab({
  spareParts,
  isLoading,
}: {
  spareParts: any[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canAddMaint = canAddInArea(user, "maintenance");
  const canEditMaint = canEditInArea(user, "maintenance");
  const canDeleteMaint = canDeleteInArea(user, "maintenance");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSparePartMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/spare-parts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: t("maintenance.toast.sparePartCreated") });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("maintenance.toast.sparePartCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const updateSparePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/spare-parts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: t("maintenance.toast.sparePartUpdated") });
      setIsEditDialogOpen(false);
      setSelectedPart(null);
    },
    onError: () => {
      toast({
        title: t("maintenance.toast.sparePartUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const deleteSparePartMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/spare-parts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: t("maintenance.toast.sparePartDeleted") });
      setPartToDelete(null);
    },
    onError: () => {
      toast({
        title: t("maintenance.toast.sparePartDeleteFailed"),
        variant: "destructive",
      });
    },
  });

  const handleView = (part: any) => {
    setSelectedPart(part);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (part: any) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (part: any) => {
    setPartToDelete(part);
  };

  const confirmDelete = () => {
    if (partToDelete) {
      deleteSparePartMutation.mutate(partToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("maintenance.sparePartsManagement")}
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {canAddMaint && (
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 ml-2" />
              {t("maintenance.addNewSparePart")}
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("maintenance.addNewSparePart")}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {t("maintenance.addSparePartDescription")}
              </DialogDescription>
            </DialogHeader>
            <SparePartForm
              onSubmit={createSparePartMutation.mutate}
              isLoading={createSparePartMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.partNumber")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.machineName")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.partName")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.code")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.serialNumber")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("maintenance.specifications")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(spareParts) && spareParts.length > 0 ? (
                    spareParts.map((part: any) => (
                      <tr key={part.part_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {part.part_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {part.machine_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {part.part_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {part.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {part.serial_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate text-center">
                          {part.specifications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleView(part)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditMaint && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(part)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            )}
                            {canDeleteMaint && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleDelete(part)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {t("maintenance.noSpareParts")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("maintenance.sparePartDetails")}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {t("maintenance.sparePartDetailsDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("maintenance.partNumber")}
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedPart.part_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("maintenance.code")}
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedPart.code}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("maintenance.machineName")}
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPart.machine_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("maintenance.partName")}
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedPart.part_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("maintenance.serialNumber")}
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedPart.serial_number}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("maintenance.specifications")}
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPart.specifications}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("maintenance.editSparePart")}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {t("maintenance.editSparePartDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <SparePartEditForm
              part={selectedPart}
              onSubmit={(data) =>
                updateSparePartMutation.mutate({ id: selectedPart.id, data })
              }
              isLoading={updateSparePartMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!partToDelete} onOpenChange={() => setPartToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("maintenance.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {t("maintenance.confirmDeleteSparePartMessage")}
            </DialogDescription>
          </DialogHeader>
          {partToDelete && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                {t("maintenance.deleteSparePartWarning", {
                  id: partToDelete.part_id,
                  name: partToDelete.part_name,
                })}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPartToDelete(null)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteSparePartMutation.isPending}
                >
                  {deleteSparePartMutation.isPending
                    ? t("maintenance.deleting")
                    : t("maintenance.delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SparePartForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { data: spareParts } = useQuery({ queryKey: ["/api/spare-parts"] });
  const { data: machines } = useQuery({ queryKey: ["/api/machines"] });

  const generateNextPartId = (currentSpareParts: any[]) => {
    if (!Array.isArray(currentSpareParts)) return "SP001";

    const partNumbers = currentSpareParts
      .map((part: any) => part.part_id)
      .filter((id: string) => id && id.match(/^SP\d+$/))
      .map((id: string) => parseInt(id.replace("SP", "")))
      .filter((num: number) => !isNaN(num));

    const nextNumber =
      partNumbers.length > 0 ? Math.max(...partNumbers) + 1 : 1;
    return `SP${nextNumber.toString().padStart(3, "0")}`;
  };

  const form = useForm({
    defaultValues: {
      part_id: "SP001",
      machine_name: "",
      part_name: "",
      code: "",
      serial_number: "",
      specifications: "",
    },
  });

  useEffect(() => {
    if (spareParts && Array.isArray(spareParts)) {
      const nextId = generateNextPartId(spareParts);
      if (nextId !== form.getValues("part_id")) {
        form.setValue("part_id", nextId);
      }
    }
  }, [spareParts, form]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="part_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.partNumberAuto")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="bg-gray-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.code")}</FormLabel>
                <FormControl>
                  <Input placeholder="A8908" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="machine_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.machineName")}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("maintenance.selectMachine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(machines) && machines.length > 0 ? (
                      machines.map((machine: any) => {
                        const label =
                          machine.name_ar || machine.name || `#${machine.id}`;
                        return (
                          <SelectItem key={machine.id} value={label}>
                            {label} ({machine.id})
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no_machines">
                        {t("maintenance.noMachinesAvailable")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="part_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.partName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("maintenance.partNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.serialNumber")}</FormLabel>
                <FormControl>
                  <Input placeholder="E5SH973798" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.specifications")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("maintenance.specificationsPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? t("maintenance.saving") : t("maintenance.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SparePartEditForm({
  part,
  onSubmit,
  isLoading,
}: {
  part: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { data: machines } = useQuery({ queryKey: ["/api/machines"] });

  const form = useForm({
    defaultValues: {
      part_id: part.part_id || "",
      machine_name: part.machine_name || "",
      part_name: part.part_name || "",
      code: part.code || "",
      serial_number: part.serial_number || "",
      specifications: part.specifications || "",
    },
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="part_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.partNumber")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="bg-gray-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.code")}</FormLabel>
                <FormControl>
                  <Input placeholder="A8908" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="machine_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.machineName")}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("maintenance.selectMachine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(machines) && machines.length > 0 ? (
                      machines.map((machine: any) => {
                        const label =
                          machine.name_ar || machine.name || `#${machine.id}`;
                        return (
                          <SelectItem key={machine.id} value={label}>
                            {label} ({machine.id})
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no_machines">
                        {t("maintenance.noMachinesAvailable")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="part_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.partName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("maintenance.partNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.serialNumber")}</FormLabel>
                <FormControl>
                  <Input placeholder="E5SH973798" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.specifications")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("maintenance.specificationsPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? t("maintenance.updating") : t("maintenance.update")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
