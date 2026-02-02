import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

/**
 * Use this endpoint as much as possible to get a presigned URL for uploading files to S3.
 */
export async function POST(req: Request) {
  const { fileName, fileType } = await req.json();

  if (!fileName) {
    return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
  }

  // Put timestamp first for better S3 performance
  const key = `billing-statements/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: fileType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1h

  return NextResponse.json({ uploadUrl });
}
