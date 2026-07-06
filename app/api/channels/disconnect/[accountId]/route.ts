import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  return backendFetch(req, `/channels/disconnect/${params.accountId}`);
}