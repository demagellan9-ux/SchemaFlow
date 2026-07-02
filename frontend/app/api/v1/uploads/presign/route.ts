import { NextRequest, NextResponse } from "next/server";

// Thin proxy → FastAPI POST /api/v1/uploads/presign
// TODO: Forward Authorization header; return presigned URL and upload_id
export async function POST(req: NextRequest) {
  const apiUrl = process.env.FASTAPI_URL;
  if (!apiUrl) return NextResponse.json({ error: "FASTAPI_URL not configured" }, { status: 500 });

  const body = await req.json();
  const upstream = await fetch(`${apiUrl}/api/v1/uploads/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("Authorization") ?? "",
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
