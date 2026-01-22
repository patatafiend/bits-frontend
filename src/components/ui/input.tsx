import * as React from "react"
import { Button } from "./button";
import { Eye, EyeClosed } from "lucide-react";
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative flex items-center">
      <Input
        type={show ? "text" : "password"}
        data-slot="password-input"
        className={cn("placeholder:text-muted-foreground pr-10", className)}
        {...props}
      />

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          onClick={() => setShow((prev) => !prev)}
          type="button"
          variant="ghost"
          className="absolute right-0"
        >
          {show ? <Eye /> : <EyeClosed />}
        </Button>
      </div>
    </div>
  );
}

export { Input, PasswordInput }
