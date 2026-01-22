import "server-only";

import { NextRequest } from "next/server";
import { tryCatch } from "./helper";
import { UserPayload } from "./types";

export async function getCurrentUser(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) {
    throw new Error("Failed to fetch user data");
  }
  const { data, error } = await tryCatch(
    fetch(`${process.env.BACKEND_URL}/user/current_user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),
  );
  if (error || !data?.ok) {
    console.error("Error fetching current user:", error);
    throw new Error("Failed to fetch user data");
  }
  const user = (await data.json()) as UserPayload;
  return user;
}
