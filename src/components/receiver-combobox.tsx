import { Receiver } from "@/hooks/use-receiver";
import { useEffect } from "react";
import { ComboBox } from "./combo-box";
import { ComboBoxProps } from "@/lib/types";


export default function ReceiverComboBox({
  value = "",
  onValueChange,
  receiverData,
  ...props
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  receiverData: Receiver[] | null;
} & Omit<ComboBoxProps, "options">) {

  // Build options from receivers
  const options = receiverData?.map((r) => ({
    label: r.receiver_name,
    value: String(r.id),
  })) ?? [];

  // normalized controlled value
  const controlledValue = value ?? "";

  // If the selected value no longer exists in options, clear it
  useEffect(() => {
    if (controlledValue && !options.find((o) => o.value === controlledValue)) {
      onValueChange?.("");
    }
  }, [controlledValue, options, onValueChange]);

  return (
    <ComboBox
      {...props}
      options={options}
      value={controlledValue}
      onValueChange={(val) => onValueChange?.(val)}
    />
  );
}
