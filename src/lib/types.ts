export type UserPayload = {
  id: string;
  email: string;
  account_type: string;
  username: string;
  first_name: string;
  middle_name: string;
  role: string;
  last_name: string;
  phone_number: string;
  profile_url: string;
  mfa_enabled?: boolean;
  created_at: string;
  exp: string;
  wh_id: string;
  allow_skip_mfa: boolean;
  permissions: string[];
  company: string;
};

export type User = {
  id: number;
  account_type: string;
  username: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  profile_url: string;
  created_at: Date;
  updated_at: Date;
  is_blocked: boolean;
  role?: string | undefined;
  role_id?: number | undefined;
  mfa_enabled: boolean;
};

export type CreateUser = {
  account_type: string;
  username: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
  password?: string;
  role_id?: number;
};

export type Option = {
  value: string;
  label: string;
};


export type ComboBoxProps = {
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  showClear?: boolean;
  virtualize?: boolean;
};

export type Role = {
  id: number;
  name: string;
  created_at: string;
  account_type: string;
  company_id: string | null;
  description: string;
  updated_at: string;
  client_id: number;
};

export type CreateRole = {
  role_schema: {
    name: string;
    description?: string | null;
    account_type: string;
  };
  permissions: string[];
};

export type Permission = {
  id: number;
  resource: string;
  action: string;
  description: string;
};

export type RoleWithUserPermissions = Role & {
  permissions: Permission[];
  users: User[];
};