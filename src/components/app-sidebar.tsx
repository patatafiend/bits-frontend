"use client";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { ChevronRight, ReceiptText, UserPen, Home } from "lucide-react";
import { ComboBox } from "./combo-box";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCurrentUser } from "./providers/auth-provider";
import { UserPayload } from "@/lib/types";
import { NavUser } from "./nav-user";
import { usePathname } from "next/navigation";

type NavSubItem = {
  title: string;
  url: string;
  permission?: string;
  accountTypes?: string[];
  roles?: string[];
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive?: boolean;
  permission?: string;
  accountTypes?: string[];
  items?: NavSubItem[];
  roles?: string[];
};

function canAccess(
  user: UserPayload | null,
  item: { permission?: string; accountTypes?: string[]; roles?: string[] },
) {
  if (
    item.accountTypes &&
    !item.accountTypes.includes(user?.account_type ?? "")
  )
    return false;
  if (item.permission && !user?.permissions?.includes(item.permission))
    return false;
  if (item.roles && !item.roles.includes(user?.role ?? "")) return false;
  return true;
}

const clientData: { navMain: NavItem[]; adminMain: NavItem[] } = {
  navMain: [
    {
      title: "Transmittal Management",
      url: "/client/bill-management",
      icon: ReceiptText,
      isActive: true,
      roles: ["admin", "billing admin", "billing admin MWFL"],
      items: [
        {
          title: "Transmittals",
          url: "/client/bill-management/transmittal",
          permission: "billing:read",
        },
      ],
    },
    {
      title: "Operations",
      url: "/client/operations",
      icon: ReceiptText,
      isActive: true,
      roles: ["admin", "operations admin", "operations admin MWFL"],
      items: [
        {
          title: "Transmittals",
          url: "/client/operations/transmittal",
          permission: "billing:read",
        },
      ],
    },
    {
      title: "Deliver",
      url: "/client/outbound",
      icon: ReceiptText,
      isActive: true,
      roles: ["admin", "billing officer"],
      items: [
        {
          title: "Transmittals",
          url: "/client/outbound/transmittals",
          permission: "billing:read",
        },
      ],
    },
    {
      title: "Management",
      url: "/client/management",
      icon: ReceiptText,
      isActive: true,
      roles: ["admin", "billing admin"],
      items: [
        {
          title: "Manage Receivers",
          url: "/client/management/manage-receivers",
          permission: "receiver:read",
        },
      ],
    },
  ],
  adminMain: [
    {
      title: "User Management",
      url: "/client/admin/user-management",
      icon: UserPen,
      isActive: true,
      items: [
        {
          title: "Manage Users",
          url: "/client/admin/user-management/manage-users",
          permission: "user:read",
        },
        {
          title: "Manage User Roles",
          url: "/client/admin/user-management/manage-user-roles",
          permission: "role:read",
        },
      ],
    },
    {
      title: "Billing Management",
      url: "/client/admin/billing-management",
      icon: ReceiptText,
      isActive: true,
      items: [
        {
          title: "Manage Receivers",
          url: "/client/admin/billing-management/manage-receivers",
          permission: "receiver:read",
        },
      ],
    },
    // {
    //   title: "Client Management",
    //   url: "/client/admin/client-management",
    //   icon: ReceiptText,
    //   isActive: true,
    //   accountTypes: ["company_account"],
    //   items: [
    //     {
    //       title: "Clients",
    //       url: "/client/admin/client-management/manage-client",
    //     },
    //   ],
    // },
  ],
};

export function AppSidebar() {
  const user = useCurrentUser();
  const isAdmin =
    user?.account_type === "admin_account" ||
    user?.account_type === "company_account" ||
    user?.account_type === "super_admin_account";

  const [workspace, setWorkspace] = useState<"admin" | "billing">("billing");
  const pathname = usePathname();

  const rawItems =
    workspace === "admin" ? clientData.adminMain : clientData.navMain;
  const navItems = rawItems
    .filter((item) => canAccess(user, item))
    .map((item) => ({
      ...item,
      items: item.items?.filter((sub) => canAccess(user, sub)),
    }));

  const workspaceOptions = [
    { value: "billing", label: "Billing Management" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2">
              {isAdmin && (
                <ComboBox
                  options={workspaceOptions}
                  value={workspace}
                  onValueChange={(value) =>
                    setWorkspace(value as "admin" | "billing")
                  }
                />
              )}
              <SidebarMenuButton asChild isActive={pathname === "/client"}>
                <Link href="/client">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <Collapsible
                key={item.title}
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
