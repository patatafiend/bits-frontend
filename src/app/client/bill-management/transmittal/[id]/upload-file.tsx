import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMultiFileUpload } from "@/hooks/use-multi-file-upload";
import { useAddItemToTransmittal } from "@/hooks/use-transmittal";
import { UploadInvoiceFileProps } from "@/lib/types";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export function UploadFile({
  transmittalData,
  transmittalId,
  refetchTransmittal,
}: UploadInvoiceFileProps) {
  const { execute: addItemToTransmittal, loading: addingItem } =
    useAddItemToTransmittal();

  const {
    files,
    addFiles,
    removeFile,
    reset,
    uploadAll,
    isAnyUploading,
    isAnyCompressing,
    hasErrors,
    allCompleted,
  } = useMultiFileUpload({ concurrency: 3 });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      addFiles(acceptedFiles);
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    disabled: isAnyUploading || isAnyCompressing,
    multiple: true,
  });

  async function handleAddItems() {
    if (files.length === 0 || !transmittalData) return;

    try {
      const urls = await uploadAll("billing-statements");

      if (!urls || urls.length === 0) {
        toast.error("Failed to upload files to S3. Please try again.");
        return;
      }

      const items = urls.map((url, index) => {
        const urlObj = new URL(url);
        const s3Key = urlObj.pathname.substring(1);
        const file = files[index].file;

        return {
          transmittal_id: transmittalData.id,
          file_name: file.name,
          file_key: s3Key,
          file_size: file.size.toString(),
          file_type: file.type,
          s3_bucket: `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}`,
        };
      });

      const { error: dbError } = await addItemToTransmittal({
        body: items,
        params: `/${transmittalId}/items`,
      });

      if (dbError) {
        toast.error(
          `Files uploaded but failed to save records: ${dbError.message}. Please contact support.`,
        );
        return;
      }

      await refetchTransmittal({
        params: `${transmittalId}`,
        query: { include_items: true },
      });
      reset();
      toast.success(`Successfully uploaded ${urls.length} file(s)!`);
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      toast.error(
        "An unexpected error occurred. Please try again or contact support.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Billing Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${isAnyUploading || isAnyCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm font-medium">Drop files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: Images, PDF, Excel
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.compressing && (
                    <p className="text-xs text-blue-600">Compressing...</p>
                  )}
                  {item.uploading && (
                    <div className="mt-1">
                      <Progress value={item.progress} className="h-1" />
                    </div>
                  )}
                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                  {item.url && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </p>
                  )}
                </div>
                {!item.uploading && !item.compressing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {(isAnyUploading || isAnyCompressing) && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            {isAnyCompressing ? "Compressing images..." : "Uploading files..."}
          </div>
        )}

        {hasErrors && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Some files failed to upload</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleAddItems}
            disabled={
              files.length === 0 ||
              isAnyUploading ||
              isAnyCompressing ||
              addingItem ||
              allCompleted
            }
            className="flex-1"
          >
            {isAnyUploading
              ? "Uploading..."
              : addingItem
                ? "Saving..."
                : `Upload ${files.length} File(s)`}
          </Button>
          {files.length > 0 && (
            <Button
              onClick={reset}
              variant="outline"
              disabled={isAnyUploading || isAnyCompressing || addingItem}
            >
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}