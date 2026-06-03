import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function backendFetch(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  const cookie = request.headers.get("cookie") ?? "";
  const url = `${BACKEND_URL}${path}`;

  let body: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (
    ["POST", "PUT", "PATCH"].includes(request.method) &&
    contentType.includes("application/json")
  ) {
    body = await request.text();
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[backendFetch] Failed to reach backend:", url, err);
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 503 }
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  const response = NextResponse.json(data, { status: res.status });

  // Copia todos os set-cookie um por um
  const setCookieHeader = res.headers.get("set-cookie");
  if (setCookieHeader) {
    response.headers.set("set-cookie", setCookieHeader);
  }

  return response;
}