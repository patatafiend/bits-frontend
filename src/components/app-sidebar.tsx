"use client";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDown, File } from "lucide-react";

const clientData = {
  navMain: [
    {
      title: "Bill Management",
      url: "/client/bill-management",
      icon: File,
      isActive: true,
      items: [
        {
          title: "Bill Upload",
          url: "/client/bill-management/bill-upload",
        },
        {
          title: "Bill Endorse",
          url: "/client/bill-management/bill-endorse",
        },
      ],
    },
  ],
  adminMain: [
    {
      title: "User Management",
      url: "/client/admin/user-management",
      icon: File,
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
  ],
};

export function AppSidebar() {
  const [workspace, setWorkspace] = useState<"admin" | "billing">("billing");
  const navItems =
    workspace === "admin" ? clientData.adminMain : clientData.navMain;
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {workspace === "admin" ? "Admin" : "Billing Management"}
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem onClick={() => setWorkspace("admin")}>
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setWorkspace("billing")}>
                  Billing Management
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarMenu>
              {item.items?.map((subItem) => (
                <SidebarMenuItem key={subItem.title}>
                  <SidebarMenuButton asChild>
                    <a href={subItem.url}>{subItem.title}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
