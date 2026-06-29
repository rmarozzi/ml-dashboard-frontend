import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function PUT(req: NextRequest, { params }: { params: { sku: string } }) {
  return backendFetch(req, `/costs/${params.sku}`);
}