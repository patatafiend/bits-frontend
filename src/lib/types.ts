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
  client_id: number;
  client: Client;
  business_unit_id?: [];
  business_units?: BusinessUnit[];
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
  client_id?: number;
  business_unit_id?: [];
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
  allowDownload?: boolean;
};

export type Receiver = {
  id: number;
  receiver_name: string;
  receiver_email: string;
  receiver_phone?: string;
  receiver_position?: string;
  is_active: boolean;
  client_id?: number;
  business_unit_id?: number;
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
  billing_transmittal_number?: string | null;
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
  business_unit_id: number;
};

export type TransmittalWithItems = {
  id: number;
  transmittal_number: string;
  billing_transmittal_number?: string | null;
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
  business_unit_id: number;
};

export type TransmittalItems = {
  id: number;
  transmittal_id: number;
  transmittal_item_number: string;
  reference_number: string;
  status: string;
  rejection_reason?: string | null;
  return_date: string;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
  uploaded_by: string;
  uploaded_at: string;
  category: string;
};

export type TransmittalItemAction = {
  id: number;
  transmittal_id: number;
  transmittal_item_number: string;
  status: string;
  rejection_reason?: string | null;
  return_date: string;
  action: string;
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type ItemActionUpdate = Partial<TransmittalItemAction>;

export type CreateTransmittal = {
  transmittal_number: string;
  billing_transmittal_number: string;
  resubmitted_from_id: number | null;
  client_id: number;
  business_unit_id: number;
  status: string;
};

export type UpdateTransmittal = Partial<Transmittal>;

export type SendTransmittalRequest = {
  billing_receiver_id: number;
  cc_emails?: string[] | null;
};

export type AddTransmittalItemPayload = {
  transmittal_id: number;
  transmittal_item_number?: string | null;
  return_date?: string | null;
  status: string;
  category?: "billing_statement" | "proof_attachment";
  file_name: string;
  file_key: string;
  file_size: string;
  file_type: string;
  s3_bucket: string;
};

type UploadMode = "billing_statement" | "proof_attachment";
export type UploadInvoiceFileProps = {
  mode?: UploadMode;
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
  itemLoading?: boolean;
  items?: TransmittalItems[] | null;
};

export type TransmittalStats = {
  total: number;
  draft: number;
  pending: number;
  endorsed: number;
  forwarded: number;
  accepted: number;
  sent: number;
  rejected: number;
  assigned_user: number;
};

export type BusinessUnit = {
  id: number;
  client_id: number;
  name: string;
  description?: string | null;
  code?: string | null;
  business_unit_email?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientDetail = {
  id: number;
  company_id: number;
  system_type: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string | null;
  client_tel?: string | null;
  client_description?: string | null;
  status: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
  business_units: BusinessUnit[];
};

export type CreateClient = {
  company_id: number;
  system_type?: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  client_tel?: string | null;
  client_description?: string | null;
  status: string;
};

export type UpdateClient = Partial<CreateClient> & {
  is_blocked?: boolean;
};

export type CreateBusinessUnit = {
  name: string;
  description?: string | null;
  code?: string | null;
  business_unit_email?: string | null;
};

export type UpdateBusinessUnit = Partial<CreateBusinessUnit> & {
  business_unit_email?: string | null;
  is_active?: boolean;
};

export type TrendGroupBy = "day" | "week" | "month";
export type ReportFormat = "csv" | "xlsx" | "pdf";

export type ReportFilters = {
  start_date?: string;
  end_date?: string;
  client_id?: number;
  business_unit_id?: number;
  business_unit_ids?: number[];
  assigned_operation_admin?: number;
  assigned_operation_admin_ids?: number[];
  assigned_billing_officer?: number;
  assigned_billing_officer_ids?: number[];
  created_by_user_id?: number;
  created_by_user_ids?: number[];
  statuses?: string[];
};

export type TransmittalReportSummary = {
  total: number;
  draft: number;
  pending: number;
  endorsed: number;
  forwarded: number;
  sent: number;
  accepted: number;
  rejected: number;
  returned: number;
  partially_returned: number;
};

export type TransmittalReportTrendItem = {
  bucket: string;
  total: number;
  draft: number;
  pending: number;
  endorsed: number;
  forwarded: number;
  sent: number;
  accepted: number;
  rejected: number;
  returned: number;
  partially_returned: number;
};

export type TransmittalReportTrendResponse = {
  group_by: TrendGroupBy;
  items: TransmittalReportTrendItem[];
};

export type ReportExportRequest = {
  format: ReportFormat;
  group_by: TrendGroupBy;
  filters: ReportFilters;
};

export type ReportJob = {
  id: number;
  report_type: string;
  format: ReportFormat;
  status: string;
  requested_by: number;
  filters: {
    group_by?: TrendGroupBy;
    filters?: ReportFilters;
  };
  output_key?: string | null;
  output_filename?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportJobCreateResponse = {
  detail: string;
  job_id: number;
  status: string;
};

export type ReportDownloadResponse = {
  url: string;
  file_name: string;
  expires_at?: string | null;
};
