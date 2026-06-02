import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function PUT(req: NextRequest, { params }: { params: { id: string; employeeId: string } }) { return backendFetch(req, `/admin/clients/${params.id}/employees/${params.employeeId}/permissions`); }
