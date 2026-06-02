import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { return backendFetch(req, `/admin/clients/${params.id}/employees`); }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) { return backendFetch(req, `/admin/clients/${params.id}/employees`); }
