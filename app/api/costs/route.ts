import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(req: NextRequest) { return backendFetch(req, "/costs"); }
export async function POST(req: NextRequest) { return backendFetch(req, "/costs"); }
