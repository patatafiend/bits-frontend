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
} from "@/components/ui/sidebar";
import { useState } from "react";
import { ChevronRight, ReceiptText, UserPen } from "lucide-react";
import { ComboBox } from "./combo-box";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCurrentUser } from "./providers/auth-provider";
import { UserPayload } from "@/lib/types";

type NavSubItem = {
  title: string;
  url: string;
  permission?: string;
  accountTypes?: string[];
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive?: boolean;
  permission?: string;
  accountTypes?: string[];
  items?: NavSubItem[];
};

function canAccess(
  user: UserPayload | null,
  item: { permission?: string; accountTypes?: string[] },
) {
  if (
    item.accountTypes &&
    !item.accountTypes.includes(user?.account_type ?? "")
  )
    return false;
  if (item.permission && !user?.permissions?.includes(item.permission))
    return false;
  return true;
}

const clientData: { navMain: NavItem[]; adminMain: NavItem[] } = {
  navMain: [
    {
      title: "Bill Management",
      url: "/client/bill-management",
      icon: ReceiptText,
      isActive: true,
      items: [
        {
          title: "Bill Invoices",
          url: "/client/bill-management/invoice",
          permission: "billing:read",
        },
        {
          title: "Bill Statements",
          url: "/client/bill-management/bill-statements",
          permission: "billing:read",
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
  ],
};

export function AppSidebar() {
  const user = useCurrentUser();
  const isAdmin = user?.account_type === "admin_account";
  const [workspace, setWorkspace] = useState<"admin" | "billing">("billing");

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
            {isAdmin && (
              <ComboBox
                options={workspaceOptions}
                value={workspace}
                onValueChange={(value) =>
                  setWorkspace(value as "admin" | "billing")
                }
              />
            )}
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
    </Sidebar>
  );
}
