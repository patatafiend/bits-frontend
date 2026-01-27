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
