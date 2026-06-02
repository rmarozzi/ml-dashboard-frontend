import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(req: NextRequest) { return backendFetch(req, "/dashboard/stats"); }
