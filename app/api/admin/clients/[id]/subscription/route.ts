import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { return backendFetch(req, `/admin/clients/${params.id}/subscription`); }
