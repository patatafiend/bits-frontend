import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

type ControlledDialogProps = {
  title: string;
  description: string;
  className?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode | ((closeDialog?: () => void) => React.ReactNode);
};
export default function ControlledDialog({
  title,
  description,
  className,
  open,
  setOpen,
  children,
}: ControlledDialogProps) {
  const closeDialog = () => setOpen(false);
  const renderChildren =
    typeof children === "function" ? children(closeDialog) : children;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
