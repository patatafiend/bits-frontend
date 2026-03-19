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
  client: Client;
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

export type PaginatedInvoice = {
  items: Invoice[];
  total: number;
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
  billing_receiver: Receiver | null;
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

export type Receiver = {
  id: number;
  receiver_name: string;
  receiver_email: string;
  receiver_phone?: string;
  receiver_position?: string;
  is_active: boolean;
  client_id: number;
  created_by?: string;
};

export type CreateReceiver = Omit<Receiver, "id">;

export type UpdateReceiver = Partial<Receiver>;

export type InvoiceModalProps = {
  client_id?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type Transmittal = {
  id: number;
  transmittal_number: string;
  client_id: number;
  billing_receiver_id: number;
  status: string;
  transmittal_date: string;
  sent_date: string;
  received_date: string;
  response_date: string;
  submitted_date: string;
  endorsed_date: string;
  forwarded_date: string;
  notes: string;
  rejection_reason: string;
  created_by: string;
  created_at: string;
  assigned_operation_admin: number | null;
  assigned_billing_officer: number | null;
  billing_receiver_email: string | null;
  billing_receiver_name: string | null;
  billing_receiver_company: string | null;
  resubmitted_as_id: number | null;
  resubmitted_from_id: number | null;
  transmittal_items: TransmittalItems[];
  operation_admin_assigned: User;
  billing_officer_assigned: User;
};

export type TransmittalWithItems = {
  id: number;
  transmittal_number: string;
  client_id: number;
  billing_receiver_id: number;
  status: string;
  transmittal_date: string;
  sent_date: string;
  received_date: string;
  response_date: string;
  submitted_date: string;
  endorsed_date: string;
  forwarded_date: string;
  notes: string;
  rejection_reason: string;
  created_by: string;
  created_at: string;
  assigned_operation_admin: number | null;
  assigned_billing_officer: number | null;
  billing_receiver_email: string | null;
  billing_receiver_name: string | null;
  billing_receiver_company: string | null;
  resubmitted_as_id: number | null;
  resubmitted_from_id: number | null;
  transmittal_items: TransmittalItems[];
  billing_receiver: Receiver | null;
  operation_admin_assigned: User;
  billing_officer_assigned: User;
};

export type TransmittalItems = {
  id: number;
  transmittal_id: number;
  transmittal_item_number: number;
  status: string;
  return_date: string;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type CreateTransmittal = {
  transmittal_number: string;
  resubmitted_from_id: number | null;
  client_id: number;
  status: string;
};

export type UpdateTransmittal = Partial<Transmittal>;

export type AddTransmittalItemPayload = {
  transmittal_id: number;
  status: string;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
};

export type UploadInvoiceFileProps = {
  transmittalData: TransmittalWithItems | null;
  transmittalId?: number;
  refetchTransmittal: ({
    params,
    query,
  }: {
    params: string;
    query: { include_items: boolean };
  }) => void;
};

export type PaginatedTransmittal = {
  items: Transmittal[];
  total: number;
};

export type TransmittalModalProps = {
  client_id?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  transmittalData?: Transmittal;
};
