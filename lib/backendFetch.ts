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
    });
  } catch (err) {
    console.error("[backendFetch] Failed to reach backend:", url, err);
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 503 }
    );
  }

  const responseHeaders = new Headers();

  // Forward ALL set-cookie headers
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      responseHeaders.append("set-cookie", value);
    }
  });

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