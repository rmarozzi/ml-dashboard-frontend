import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function backendFetch(
  request: NextRequest,
  path: string,
  options?: RequestInit
): Promise<NextResponse> {
  const cookie = request.headers.get("cookie") ?? "";
  const url = `${BACKEND_URL}${path}`;

  let body: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";

  if (["POST", "PUT", "PATCH"].includes(request.method) && contentType.includes("application/json")) {
    body = await request.text();
  }

  const res = await fetch(url, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body,
    ...options,
  });

  const responseHeaders = new Headers();
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) responseHeaders.set("set-cookie", setCookie);
  responseHeaders.set("content-type", "application/json");

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return NextResponse.json(data, {
    status: res.status,
    headers: responseHeaders,
  });
}

export function makeRoute(backendPath: string) {
  return {
    GET: (req: NextRequest) => backendFetch(req, backendPath),
    POST: (req: NextRequest) => backendFetch(req, backendPath),
    PUT: (req: NextRequest) => backendFetch(req, backendPath),
    DELETE: (req: NextRequest) => backendFetch(req, backendPath),
    PATCH: (req: NextRequest) => backendFetch(req, backendPath),
  };
}
