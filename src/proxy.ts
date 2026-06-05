import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { v4 as uuidv4 } from "uuid";

const limiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds by IP
});

const BLOCKED_PATHS = [
  "/env",
  "/.env",
  "/config",
  "/.config",
  "/settings",
  "/.settings",
  ".php",
  ".exe",
  ".sh",
  ".txt1",
];

export default async function middleware(request: NextRequest) {
  if (BLOCKED_PATHS.some((path) => request.nextUrl.pathname.includes(path))) {
    logger(request, { blocked: true });
    return new NextResponse("Not Found", { status: 404 });
  }
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  try {
    await limiter.consume(ip || "unknown");
  } catch {
    logger(request, { tooManyRequests: true });
    return new NextResponse("Too Many Requests", { status: 429 });
  }
  if (process.env.NODE_ENV === "production") {
    logger(request);
  }
  return NextResponse.next();
}

function logger(
  request: NextRequest,
  additionalInfo?: Record<string, unknown>,
) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  const uaHeader = request.headers.get("user-agent");
  const parser = new UAParser(uaHeader || undefined);
  const parserResults = parser.getResult();
  const log = {
    id: uuidv4(),
    service: "bits-frontend",
    method: request.method,
    search: request.nextUrl.search,
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    ip,
    timestamp: new Date().toISOString(),
    datetime: new Date().toLocaleTimeString(),
    referrer: request.headers.get("referer"),
    tooManyRequests: false,
    device: {
      browser: parserResults.browser.name,
      browserVersion: parserResults.browser.version,
      os: parserResults.os.name,
      osVersion: parserResults.os.version,
      deviceType: parserResults.device.type || "desktop",
      deviceVendor: parserResults.device.vendor,
      deviceModel: parserResults.device.model,
    },
    ...additionalInfo,
  };

  // Avoid unhandled rejections in middleware when the outbound fetch fails.
  void fetch("https://meilisearch.y3eet.me/indexes/logs/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
    },
    body: JSON.stringify([log]),
  }).catch((err) => {
    console.warn("Failed to send log to Meilisearch", err);
  });

  console.info(log);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/public).*)"
  ],
};
