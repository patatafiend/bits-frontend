import { Receiver } from "@/lib/types";
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = receiverData?.map((r) => ({
    label: r.receiver_name,
    value: String(r.id),
  })) ?? [];

  const controlledValue = value ?? "";

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