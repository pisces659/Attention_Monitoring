import Link from "next/link";

import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";

export default function ReportNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report not found"
        description="The requested report is not available in the mock dataset."
      />
      <Button asChild>
        <Link href="/reports">Return to reports</Link>
      </Button>
    </div>
  );
}
