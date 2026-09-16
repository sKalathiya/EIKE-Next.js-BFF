import type { Metadata } from "next";
import { TeamsDashboard } from "@/components/teams/teams-dashboard";

export const metadata: Metadata = {
  title: "Teams",
};

export default function TeamsPage() {
  return <TeamsDashboard />;
}
