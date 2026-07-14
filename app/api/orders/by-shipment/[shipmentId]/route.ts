import { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(
  req: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  return backendFetch(req, `/orders/by-shipment/${params.shipmentId}`);
}