import type { Metadata } from "next";
import { DocumentDashboard } from "@/components/documents/document-dashboard";

export const metadata: Metadata = {
  title: "Library",
};

export default function DocumentsPage() {
  return <DocumentDashboard />;
}
