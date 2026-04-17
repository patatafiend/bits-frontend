import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "@/lib/types";

interface UserComboBoxProps {
  value?: number | null;
  onValueChange?: (val: number | null) => void;
  userData: User[] | null;
  allowNull?: boolean;
  nullLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function UserComboBox({
  value = null,
  onValueChange,
  userData,
  allowNull = false,
  nullLabel = "Unassigned",
  placeholder = "Select user...",
  disabled = false,
  className,
}: UserComboBoxProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      userData?.map((u) => ({
        label: [u.first_name, u.middle_name, u.last_name]
          .filter(Boolean)
          .join(" "),
        value: u.id,
      })) ?? [],
    [userData],
  );

  const selectedLabel =
    value != null
      ? options.find((o) => o.value === value)?.label
      : allowNull
        ? nullLabel
        : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn("flex-1 justify-between", className)}
          >
            <span className="truncate text-sm">
              {selectedLabel ?? (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* Clear button — only when a real user is selected */}
        {allowNull && value != null && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onValueChange?.(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {allowNull && (
                <CommandItem
                  value={nullLabel}
                  onSelect={() => {
                    onValueChange?.(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value == null ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {nullLabel}
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
