import { UserPayload } from "@/lib/types";

export async function verifyTokenAndGetUser(
  token: string,
): Promise<UserPayload | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/current_user`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // Don't cache auth requests
      },
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  // For Next.js API routes, cookies are accessed differently
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/access_token=([^;]+)/);
    return match ? match[1] : null;
  }

  return null;
}
