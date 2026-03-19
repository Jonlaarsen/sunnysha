import { NextResponse } from "next/server";

export async function DELETE() {
  // QC report deletion is disabled for all users
  return NextResponse.json(
    {
      error: "Forbidden",
      message: "删除检查记录功能已禁用",
    },
    { status: 403 }
  );
}
