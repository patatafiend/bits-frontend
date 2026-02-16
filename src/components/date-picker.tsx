"use client";

import * as React from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange: (date: string) => void;
  className?: string;
};

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  React.useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      parsedDate.setHours(0, 0, 0, 0);
      setDate(parsedDate);
    }
  }, [value]);

  React.useEffect(() => {
    if (date) {
      // Convert to local date string (YYYY-MM-DD) to avoid timezone issues
      const localDateString = date.toLocaleDateString("en-CA");
      console.log(localDateString);
      onChange(localDateString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    setOpen(false);
    onChange("");
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={cn("w-full justify-between", className)}
          >
            {date ? date.toLocaleDateString("en-PH") : "Select date"}
            <div className="flex items-center gap-1">
              <ChevronDownIcon />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2300, 11)}
          />
          {date && (
            <Button
              onClick={handleClear}
              variant="ghost"
              className="w-full rounded-t-none border-t text-destructive flex items-center"
            >
              <XIcon />
              Clear Date
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
