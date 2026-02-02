import { NextResponse, NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});
async function uploadFileToS3(file: File, fileName: string) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  console.log(fileName);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `${fileName}-` + Date.now(),
    Body: fileBuffer,
    ContentType: file.type || "application/octet-stream",
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return fileName;
}

/** This endpoint is not used for uploading files, just use the presigning ones.
 * This is here incase some shit aint working on file uploads */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const fileName = await uploadFileToS3(file, file.name);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;

    console.log("File uploaded successfully:", fileUrl);
    return NextResponse.json({ success: true, fileName, fileUrl });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
