import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { return backendFetch(req, `/admin/alerts/${params.id}/resolve`); }
