"use client";

import useFileUpload from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function BillUploadPage() {
  const {
    file,
    fileUrl,
    progress,
    error,
    uploading,
    compressing,
    handleFileChange,
    uploadFileToS3,
    reset,
  } = useFileUpload();

  const handleUpload = async () => {
    if (!file) return;
    const url = await uploadFileToS3("billing-statements");
    if (url) {
      console.log("File uploaded successfully:", url);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Billing Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select File
            </label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading || compressing}
            />
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* Compression Status */}
          {compressing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Compressing image...
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Success Message */}
          {fileUrl && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                File uploaded successfully!
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || compressing || !!fileUrl}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
            {(file || fileUrl) && (
              <Button
                onClick={reset}
                variant="outline"
                disabled={uploading || compressing}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Public URL (for testing) */}
          {fileUrl && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                File URL:
              </label>
              <p className="text-xs break-all bg-muted p-2 rounded">
                {fileUrl}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}