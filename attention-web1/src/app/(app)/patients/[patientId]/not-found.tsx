import Link from "next/link";

import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";

export default function PatientNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient not found"
        description="The patient record you requested does not exist in the current mock dataset."
      />
      <Button asChild>
        <Link href="/patients">Return to patients</Link>
      </Button>
    </div>
  );
}
