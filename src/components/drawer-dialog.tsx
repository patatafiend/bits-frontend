"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function DrawerDialog({
  title,
  description,
  children,
  renderTrigger,
  responsive,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode | ((closeDialog?: () => void) => React.ReactNode);
  renderTrigger: React.ReactNode;
  responsive?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const closeDialog = () => setOpen(false);
  const renderChildren =
    typeof children === "function" ? children(closeDialog) : children;

  if (!isMobile || !responsive) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{renderTrigger}</DialogTrigger>
        <DialogContent className={cn("max-w-4xl", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {renderChildren}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{renderTrigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {renderChildren}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
