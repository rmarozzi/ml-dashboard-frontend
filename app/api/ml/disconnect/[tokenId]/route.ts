import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function DELETE(req: NextRequest, { params }: { params: { tokenId: string } }) { return backendFetch(req, `/ml/disconnect/${params.tokenId}`); }
