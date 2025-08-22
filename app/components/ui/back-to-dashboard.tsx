"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackToDashboard({ label = "Back to Dashboard" }: { label?: string }) {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.push('/merchant/dashboard')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> {label}
    </Button>
  );
}
