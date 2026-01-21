import { useServerFetch, useServerAction } from "@/hooks/use-server";

type MfaResponse = {
  key: string;
  totp_uri: string;
};

type MfaVerifyRequest = {
  mfa_code: string;
};

export function useMfaSetup() {
  return useServerFetch<MfaResponse>("/api/user/mfa/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function useMfaVerify() {
  return useServerAction<unknown, MfaVerifyRequest>("/api/user/mfa/verify", {
    method: "POST",
  });
}