import * as SelectPrimitive from "@radix-ui/react-select";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function AccountTypeSelect({
  onSelect,
  value,
  className,
  ...props
}: {
  onSelect: (value: string) => void;
  value: string;
  className?: string;
} & React.ComponentProps<typeof SelectPrimitive.Root>) {
  const accountTypes = [
    {
      label: "Company Account",
      value: "company_account",
    },
    {
      label: "Admin Account",
      value: "admin_account",
    },
    {
      label: "Billing Operator",
      value: "billing_account",
    },
  ];

  return (
    <Select onValueChange={onSelect} value={value ?? ""} {...props}>
      <SelectTrigger className={`w-[180px] ${className}`}>
        <SelectValue placeholder="Select an account type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Account Types</SelectLabel>
          {accountTypes.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
