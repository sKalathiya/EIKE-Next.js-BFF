import { File, FileText, FolderOpen, MessageCircle, Moon, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";

const files = [
  {
    name: "Leave policy.pdf",
    pdf: true,
    status: "Ready to ask",
    statusClass: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    teams: ["Private", "People Ops"],
  },
  {
    name: "Onboarding notes.txt",
    pdf: false,
    status: "Ready to ask",
    statusClass: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    teams: ["Private"],
  },
  {
    name: "Benefits overview.pdf",
    pdf: true,
    status: "Processing",
    statusClass: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    teams: ["People Ops"],
  },
];

function FileGlyph({ pdf }: { pdf: boolean }) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
        pdf
          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
          : "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200"
      }`}
    >
      {pdf ? <FileText className="size-3.5" /> : <File className="size-3.5" />}
    </span>
  );
}

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_20px_60px_-28px_oklch(0.24_0.04_220/0.4)]">
      <div className="pointer-events-none select-none" aria-hidden>
        <div className="relative flex h-12 items-center gap-2 border-b border-border/80 bg-card/85 px-3">
          <BrandLogo className="size-7 shrink-0" />
          <span className="text-xs font-semibold tracking-tight">Folio</span>
          <div className="mx-auto flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/45 p-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-[11px] font-medium shadow-sm">
              <FolderOpen className="size-3" />
              Library
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              Teams
            </span>
            <span className="hidden items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground sm:inline-flex">
              <MessageCircle className="size-3" />
              Chat
            </span>
          </div>
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary">
            A
          </span>
          <Moon className="size-3.5 text-muted-foreground" />
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight">Documents</p>
              <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                Upload to Private or any team you belong to.
              </p>
            </div>
            <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2 text-[11px] font-medium">
              <RefreshCw className="size-3" />
              Refresh
            </span>
          </div>

          <section className="overflow-hidden rounded-xl border border-border/80">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2.5">
              <div>
                <p className="text-xs font-medium">Your uploads</p>
                <p className="text-[11px] text-muted-foreground">Showing 3 of 3 recent files</p>
              </div>
              <span className="relative hidden w-36 sm:block">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
                <span className="flex h-7 items-center rounded-md border border-input bg-background pl-7 text-[11px] text-muted-foreground">
                  Search by file name
                </span>
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">File</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="hidden px-2 py-2 font-medium sm:table-cell">Teams</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {files.map((file) => (
                  <tr key={file.name}>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileGlyph pdf={file.pdf} />
                        <p className="truncate font-medium">{file.name}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${file.statusClass}`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2.5 sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {file.teams.map((team) => (
                          <span key={team} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                            {team}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Trash2 className="ml-auto size-3 text-destructive" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
