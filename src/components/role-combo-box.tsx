import React from "react";
import { ComboBox } from "./combo-box";
import { ComboBoxProps, Option, Role } from "@/lib/types";

export default function RoleComboBox(
  props: Omit<ComboBoxProps, "options"> & {
    options?: Option[];
    roles?: Role[] | null;
  } = {}
) {
  return (
    <ComboBox
      {...props}
      placeholder="Select a role"
      options={
        props.roles?.map((role) => ({
          value: role.id.toString(),
          label: role.name,
        })) || []
      }
    />
  );
}
