import { useServerFetch, useServerAction } from "@/hooks/use-server";

type MfaResponse = {
  key: string;
  totp_uri: string;
};

type MfaVerifyRequest = {
  mfa_code: string;
};

export function useMfaSetup() {
  return useServerFetch<MfaResponse>("/user/mfa/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function useMfaVerify() {
  return useServerAction<void, MfaVerifyRequest>("/user/mfa/verify", {
    method: "POST",
  });
}