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
  company: Company;
  client: Client;
};

export type Company = {
  id: number;
  company_name: string;
  company_email: string;
};

export type Client = {
  id: number;
  client_name: string;
  client_email: string;
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

export type Invoice = {
  id: number;
  invoice_number: string;
  client_id: number;
  billing_receiver_id: number;
  status: string;
  invoice_date: string;
  sent_date: string;
  received_date: string;
  response_date: string;
  notes: string;
  rejection_reason: string;
  created_by: string;
  created_at: string;
  invoice_items: InvoiceItems[];
};

export type InvoiceWithItems = {
  id: number;
  invoice_number: string;
  client_id: number;
  billing_receiver_id: number;
  status: string;
  invoice_date: string;
  sent_date: string;
  received_date: string;
  response_date: string;
  notes: string;
  rejection_reason: string;
  created_by: string;
  created_at: string;

  invoice_items: InvoiceItems[];
};

export type InvoiceItems = {
  id: number;
  invoice_id: number;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type CreateInvoice = {
  invoice_number: string;
  client_id: number;
  status: string;
};

export type UpdateInvoice = Partial<Invoice> & { id: number };

export type AddInvoiceItemPayload = {
  invoice_id: number;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
};

export type UploadFileProps = {
  invoiceData: InvoiceWithItems | null;
  invoiceId?: number;
  refetchInvoice: ({
    params,
    query,
  }: {
    params: string;
    query: { include_items: boolean };
  }) => void;
};

export type FileViewerModalProps = {
  file: { url: string; name: string; type: string } | null;
  onClose: () => void;
};

