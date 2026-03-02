"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, Eraser } from "lucide-react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
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

import { ComboBoxProps } from "@/lib/types";

export function ComboBox({
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  value,
  onValueChange,
  className = "w-full",
  allowEmpty = false,
  disabled = false,
  showClear,
  virtualize = false,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const virtuosoRef = React.useRef<VirtuosoHandle>(null);

  const currentValue = value ?? "";

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  React.useEffect(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 0,
      align: "start",
    });
  }, [search]);

const handleSelect = (selectedValue: string) => {
  const newValue =
    selectedValue === currentValue && allowEmpty ? "" : selectedValue;
  onValueChange?.(newValue);
  setOpen(false);
};

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <PopoverTrigger asChild className="flex-1">
          <Button
            disabled={disabled}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            <span className="truncate">
              {currentValue
                ? options.find((o) => o.value === currentValue)?.label
                : placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {showClear && currentValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect("");
            }}
          >
            <Eraser />
          </Button>
        )}
      </div>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className="overflow-hidden">
            {filteredOptions.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}

            <CommandGroup>
              {virtualize ? (
                <Virtuoso
                  ref={virtuosoRef}
                  style={{
                    height: 300,
                    width: 250,
                  }}
                  data={filteredOptions}
                  itemContent={(_, option) => (
                    <CommandItem
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentValue === option.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )}
                />
              ) : (
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === option.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
