import {
  hasPermission,
  ROUTE_PERMISSIONS,
  SETTINGS_TAB_PERMISSIONS,
  DEFINITIONS_TAB_PERMISSIONS,
  type PermissionKey,
} from "../../../shared/permissions";

import type { AuthUser } from "@/types";

export function isUserAdmin(user: AuthUser | null): boolean {
  if (!user) return false;

  return hasPermission(user.permissions, "admin");
}

// Check if user has specific permission(s)
export function userHasPermission(
  user: AuthUser | null,
  requiredPermissions: PermissionKey | PermissionKey[],
  requireAll: boolean = false,
): boolean {
  if (!user) return false;

  // Admin bypasses all permission checks
  if (isUserAdmin(user)) return true;

  return hasPermission(user.permissions, requiredPermissions, requireAll);
}

// Check if user can edit content
export function hasEditPermissions(user: AuthUser | null): boolean {
  if (!user) return false;

  // Admin can edit everything
  if (isUserAdmin(user)) return true;

  // Check for any management permission
  const managementPermissions: PermissionKey[] = [
    "manage_orders",
    "manage_production",
    "manage_maintenance",
    "manage_quality",
    "manage_inventory",
    "manage_warehouse",
    "manage_users",
    "manage_hr",
    "manage_settings",
    "manage_definitions",
    "manage_roles",
    "manage_alerts",
    "manage_mixing",
    "manage_whatsapp",
    "manage_ai_agent",
    "manage_factory_simulation",
    "manage_maintenance_actions",
    "manage_negligence",
    "manage_spare_parts",
    "manage_consumable_parts",
    "manage_quality_settings",
    "manage_customers",
    "manage_items",
    "manage_machines",
    "manage_sections",
    "manage_categories",
    "manage_master_batch",
    "manage_warehouse_vouchers",
    "manage_production_hall",
  ];

  return hasPermission(user.permissions, managementPermissions, false);
}

// Check if user can delete content
export function hasDeletePermissions(user: AuthUser | null): boolean {
  // Same as edit permissions for now
  return hasEditPermissions(user);
}

// Check if user can view a specific page/route
export function canAccessRoute(user: AuthUser | null, route: string): boolean {
  // Public pages allowed for everyone
  if (route === "/") return true;

  if (!user) return false;

  // Admin can access everything
  if (isUserAdmin(user)) return true;

  const requiredPermissions = ROUTE_PERMISSIONS[route];
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return false;
  }

  if (hasPermission(user.permissions, requiredPermissions, false)) return true;

  // Special case: /settings can be accessed by anyone with any settings tab permission
  if (route === "/settings") {
    return Object.values(SETTINGS_TAB_PERMISSIONS).some(
      (perms) =>
        perms.length > 0 && hasPermission(user.permissions, perms, false),
    );
  }

  // Special case: /definitions can be accessed by anyone with any definitions
  // tab access permission OR any granular add/edit/delete permission for any tab.
  if (route === "/definitions") {
    const hasTabAccess = Object.values(DEFINITIONS_TAB_PERMISSIONS).some(
      (perms) =>
        perms.length > 0 && hasPermission(user.permissions, perms, false),
    );
    if (hasTabAccess) return true;

    return Object.values(DEFINITIONS_TAB_ACTION_PERMISSIONS).some((actions) => {
      const granularPerms = [
        ...(actions.add || []),
        ...(actions.edit || []),
        ...(actions.delete || []),
      ];
      return (
        granularPerms.length > 0 &&
        hasPermission(user.permissions, granularPerms, false)
      );
    });
  }

  return false;
}

// Check if user can access a settings tab
export function canAccessSettingsTab(
  user: AuthUser | null,
  tabName: string,
): boolean {
  if (!user) return false;

  // Admin can access everything
  if (isUserAdmin(user)) return true;

  const requiredPermissions = SETTINGS_TAB_PERMISSIONS[tabName];
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return false;
  }

  return hasPermission(user.permissions, requiredPermissions, false);
}

// Per-tab granular action permissions for the Definitions page.
// Each tab maps to its specific add/edit/delete permission keys.
// Legacy broad permissions (manage_*, manage_definitions, admin) still
// grant all three actions for backwards compatibility.
type DefinitionsTabAction = "add" | "edit" | "delete";

const DEFINITIONS_TAB_ACTION_PERMISSIONS: Record<
  string,
  Record<DefinitionsTabAction, PermissionKey[]>
> = {
  customers: {
    add: ["add_customers", "manage_customers", "manage_definitions"],
    edit: ["edit_customers", "manage_customers", "manage_definitions"],
    delete: ["delete_customers", "manage_customers", "manage_definitions"],
  },
  sections: {
    add: ["add_sections", "manage_sections", "manage_definitions"],
    edit: ["edit_sections", "manage_sections", "manage_definitions"],
    delete: ["delete_sections", "manage_sections", "manage_definitions"],
  },
  categories: {
    add: ["add_categories", "manage_categories", "manage_definitions"],
    edit: ["edit_categories", "manage_categories", "manage_definitions"],
    delete: ["delete_categories", "manage_categories", "manage_definitions"],
  },
  items: {
    add: ["add_items", "manage_items", "manage_definitions"],
    edit: ["edit_items", "manage_items", "manage_definitions"],
    delete: ["delete_items", "manage_items", "manage_definitions"],
  },
  "customer-products": {
    add: [
      "add_customer_products",
      "manage_customers",
      "manage_definitions",
    ],
    edit: [
      "edit_customer_products",
      "manage_customers",
      "manage_definitions",
    ],
    delete: [
      "delete_customer_products",
      "manage_customers",
      "manage_definitions",
    ],
  },
  machines: {
    add: ["add_machines", "manage_machines", "manage_definitions"],
    edit: ["edit_machines", "manage_machines", "manage_definitions"],
    delete: ["delete_machines", "manage_machines", "manage_definitions"],
  },
  users: {
    add: ["add_users", "manage_users", "manage_definitions"],
    edit: ["edit_users", "manage_users", "manage_definitions"],
    delete: ["delete_users", "manage_users", "manage_definitions"],
  },
  "master-batch-colors": {
    add: ["add_master_batch", "manage_master_batch", "manage_definitions"],
    edit: ["edit_master_batch", "manage_master_batch", "manage_definitions"],
    delete: [
      "delete_master_batch",
      "manage_master_batch",
      "manage_definitions",
    ],
  },
};

function canPerformDefinitionsTabAction(
  user: AuthUser | null,
  tabName: string,
  action: DefinitionsTabAction,
): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;

  const perms = DEFINITIONS_TAB_ACTION_PERMISSIONS[tabName]?.[action];
  if (!perms || perms.length === 0) return false;

  return hasPermission(user.permissions, perms, false);
}

export function canAddInTab(
  user: AuthUser | null,
  tabName: string,
): boolean {
  return canPerformDefinitionsTabAction(user, tabName, "add");
}

export function canEditInTab(
  user: AuthUser | null,
  tabName: string,
): boolean {
  return canPerformDefinitionsTabAction(user, tabName, "edit");
}

export function canDeleteInTab(
  user: AuthUser | null,
  tabName: string,
): boolean {
  return canPerformDefinitionsTabAction(user, tabName, "delete");
}

export function canAccessDefinitionsTab(
  user: AuthUser | null,
  tabName: string,
): boolean {
  if (!user) return false;

  if (isUserAdmin(user)) return true;

  const requiredPermissions = DEFINITIONS_TAB_PERMISSIONS[tabName];
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (hasPermission(user.permissions, requiredPermissions, false)) {
      return true;
    }
  }

  // Also grant tab access if the user has any granular action permission
  // for this tab (add/edit/delete) — they should at least be able to view
  // the tab where they can perform the action.
  const actions = DEFINITIONS_TAB_ACTION_PERMISSIONS[tabName];
  if (actions) {
    const granularPerms = [
      ...(actions.add || []),
      ...(actions.edit || []),
      ...(actions.delete || []),
    ];
    if (granularPerms.length > 0) {
      return hasPermission(user.permissions, granularPerms, false);
    }
  }

  return false;
}

export function getUserRoleName(user: AuthUser | null): string {
  if (!user) return "غير مسجل";

  if (user.role_name_ar) return user.role_name_ar;
  if (user.role_name) return user.role_name;

  return "مستخدم";
}

// Check if user has any management permissions
export function isManager(user: AuthUser | null): boolean {
  if (!user) return false;

  if (isUserAdmin(user)) return true;

  const managerPermissions: PermissionKey[] = [
    "manage_orders",
    "manage_production",
    "manage_maintenance",
    "manage_quality",
    "manage_inventory",
    "manage_warehouse",
    "manage_users",
    "manage_hr",
    "manage_alerts",
    "manage_mixing",
    "manage_whatsapp",
    "manage_ai_agent",
    "manage_factory_simulation",
    "manage_maintenance_actions",
    "manage_negligence",
    "manage_spare_parts",
    "manage_consumable_parts",
    "manage_quality_settings",
    "manage_customers",
    "manage_items",
    "manage_machines",
    "manage_sections",
    "manage_categories",
    "manage_master_batch",
    "manage_warehouse_vouchers",
    "manage_production_hall",
  ];

  return hasPermission(user.permissions, managerPermissions, false);
}

// Check if user can view reports
export function canViewReports(user: AuthUser | null): boolean {
  if (!user) return false;

  return userHasPermission(user, "view_reports");
}

// Check if user can manage definitions
export function canManageDefinitions(user: AuthUser | null): boolean {
  if (!user) return false;

  return userHasPermission(user, "manage_definitions");
}

// Check if user can manage users
export function canManageUsers(user: AuthUser | null): boolean {
  if (!user) return false;

  return userHasPermission(user, "manage_users");
}

// Check if user can manage roles
export function canManageRoles(user: AuthUser | null): boolean {
  if (!user) return false;

  return userHasPermission(user, ["manage_roles", "admin"]);
}
