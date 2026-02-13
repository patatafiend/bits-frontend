"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { FileViewerModal } from "../invoice/[id]/page";

export default function InvoiceViewPage() {
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Invoice #</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Client:</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
            </div>
          </div>

          <Separator />

          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents attached to this invoice</p>
          </div>

          <Separator />

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Reject Invoice
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Accept Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}
