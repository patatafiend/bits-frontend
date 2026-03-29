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
import { ClientDetail } from "@/lib/types";

interface ClientComboBoxProps {
  value?: number | null;
  onValueChange?: (val: number | null) => void;
  clientData: ClientDetail[] | null;
  allowNull?: boolean;
  nullLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ClientComboBox({
  value = null,
  onValueChange,
  clientData,
  allowNull = false,
  nullLabel = "Unassigned",
  placeholder = "Select client...",
  disabled = false,
  className,
}: ClientComboBoxProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => clientData?.map((c) => ({ label: c.client_name, value: c.id })) ?? [],
    [clientData],
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
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
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
