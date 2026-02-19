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

const clientData = {
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
        },
        {
          title: "Bill Statements",
          url: "/client/bill-management/bill-statements",
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
        },
        {
          title: "Manage User Roles",
          url: "/client/admin/user-management/manage-user-roles",
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
        },
      ],
    },
  ],
};

export function AppSidebar() {
  const [workspace, setWorkspace] = useState<"admin" | "billing">("billing");
  const navItems =
    workspace === "admin" ? clientData.adminMain : clientData.navMain;

  const workspaceOptions = [
    { value: "billing", label: "Billing Management" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <ComboBox
              options={workspaceOptions}
              value={workspace}
              onValueChange={(value) =>
                setWorkspace(value as "admin" | "billing")
              }
            />
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
