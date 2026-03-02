import { User } from "@/lib/types";
import { useEffect } from "react";
import { ComboBox } from "./combo-box";
import { ComboBoxProps } from "@/lib/types";

export default function UserComboBox({
  value = "",
  onValueChange,
  userData,
  ...props
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  userData: User[] | null;
} & Omit<ComboBoxProps, "options">) {

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = userData?.map((r) => ({
    label: r.username,
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