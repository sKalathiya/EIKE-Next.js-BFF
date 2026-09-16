"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { File, FileText, RefreshCw, RotateCcw, Search, Share2, Trash2 } from "lucide-react";
import { deleteDocument, getLibrary, logout, retryDocument, shareDocument, unshareDocument } from "@/lib/api";
import { DocumentUpload } from "@/components/documents/document-upload";
import { ShareTeamsDialog } from "@/components/documents/share-teams-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fieldClassName } from "@/components/auth/fields";
import { notify } from "@/lib/stores/toast-store";
import { humanizeError, humanizeHttpError } from "@/lib/human-error";

type DocumentStatus = "uploading" | "pending" | "processing" | "completed" | "failed";

type TeamRef = { id: string; name: string };

type DocumentItem = {
  id: string;
  fileName: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  teams: TeamRef[];
  lastSharedWith: string;
};

type BusyAction = { id: string; kind: "delete" | "retry" | "share" | "unshare" };

const RECENT_LIMIT = 10;
const PRIVATE_TEAM_NAME = "Private";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  uploading: "Uploading",
  pending: "Pending",
  processing: "Processing",
  completed: "Ready to ask",
  failed: "Failed",
};

const STATUS_CLASS: Record<DocumentStatus, string> = {
  uploading: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  processing: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  completed: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  failed: "bg-destructive/10 text-destructive",
};

function resolveStatus(status: string): DocumentStatus {
  return STATUS_LABEL[status as DocumentStatus] ? (status as DocumentStatus) : "pending";
}

function isTeam(value: unknown): value is TeamRef {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as TeamRef).id === "string" &&
    typeof (value as TeamRef).name === "string"
  );
}

function isDocument(value: unknown): value is DocumentItem {
  if (!value || typeof value !== "object") return false;
  const item = value as DocumentItem;
  if (typeof item.id !== "string" || typeof item.fileName !== "string" || typeof item.status !== "string") {
    return false;
  }
  return Array.isArray(item.teams);
}

function formatUpdated(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FileGlyph({ fileName }: { fileName: string }) {
  const pdf = fileName.toLowerCase().endsWith(".pdf");
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        pdf
          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
          : "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200"
      }`}
    >
      {pdf ? <FileText className="size-4" /> : <File className="size-4" />}
    </span>
  );
}

export function DocumentDashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [teams, setTeams] = useState<TeamRef[]>([]);
  const [privateTeamId, setPrivateTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const knownStatus = useRef<Map<string, DocumentStatus> | null>(null);

  const load = useCallback(async () => {
    const response = await getLibrary();
    const payload: unknown = await response.json().catch(() => null);

    if (response.status === 401) {
      await logout().catch(() => undefined);
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError(humanizeHttpError(response.status, payload, "Could not load documents."));
      return;
    }

    setError(null);
    const nextDocuments =
      payload && typeof payload === "object" && Array.isArray((payload as { documents?: unknown }).documents)
        ? (payload as { documents: unknown[] }).documents.filter(isDocument).map((document) => ({
            ...document,
            status: resolveStatus(document.status),
            createdAt: typeof document.createdAt === "string" ? document.createdAt : "",
            updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : "",
            lastSharedWith: document.lastSharedWith || "Not shared",
            teams: Array.isArray(document.teams) ? document.teams.filter(isTeam) : [],
            isMine: document.isMine !== false,
          }))
        : [];
    const nextPrivateId =
      payload &&
      typeof payload === "object" &&
      typeof (payload as { privateTeamId?: unknown }).privateTeamId === "string"
        ? (payload as { privateTeamId: string }).privateTeamId
        : null;
    const nextTeams =
      payload && typeof payload === "object" && Array.isArray((payload as { teams?: unknown }).teams)
        ? (payload as { teams: unknown[] }).teams.filter(isTeam)
        : [];

    const previous = knownStatus.current;
    if (previous) {
      for (const document of nextDocuments) {
        const before = previous.get(document.id);
        if (!before || before === document.status) continue;
        if (document.status === "completed") {
          notify.success("Ready to ask", `${document.fileName} is ready.`);
        }
        if (document.status === "failed") {
          notify.error("Processing failed", `${document.fileName} could not be processed.`);
        }
      }
    }
    const map = new Map<string, DocumentStatus>();
    for (const document of nextDocuments) {
      map.set(document.id, document.status);
    }
    knownStatus.current = map;
    setDocuments(nextDocuments);
    setTeams(nextTeams);
    setPrivateTeamId(nextPrivateId);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function firstLoad() {
      setLoading(true);
      try {
        await load();
      } catch {
        if (!cancelled) setError("Could not reach the document service. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    firstLoad();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function runAction(kind: "delete" | "retry", document: DocumentItem) {
    if (kind === "delete" && !window.confirm(`Delete “${document.fileName}”? This cannot be undone.`)) {
      return;
    }

    setBusy({ id: document.id, kind });
    try {
      const response = kind === "delete"
        ? await deleteDocument(document.id)
        : await retryDocument(document.id);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, kind === "delete" ? "Could not delete the file." : "Could not retry the file.");
        setError(message);
        notify.error(kind === "delete" ? "Could not delete" : "Could not retry", message);
        return;
      }
      setError(null);
      if (kind === "delete") {
        notify.success("File removed", `${document.fileName} was deleted.`);
      } else {
        notify.info("Retry started", `${document.fileName} is being processed again.`);
      }
      await load();
    } catch {
      const message = kind === "delete" ? "Could not delete the document." : "Could not retry the document.";
      setError(message);
      notify.error(kind === "delete" ? "Could not delete" : "Could not retry", message);
    } finally {
      setBusy(null);
    }
  }

  function shareTargets(document: DocumentItem) {
    const sharedIds = new Set(document.teams.map((team) => team.id));
    return teams.filter((team) => team.name !== PRIVATE_TEAM_NAME && !sharedIds.has(team.id));
  }

  function unshareTargets(document: DocumentItem) {
    return document.teams.filter((team) => team.name !== PRIVATE_TEAM_NAME);
  }

  function unshareReturnsToPrivate(document: DocumentItem, teamIds: string[]) {
    const removing = new Set(teamIds);
    return unshareTargets(document).every((team) => removing.has(team.id));
  }

  async function runShareAction(kind: "share" | "unshare", document: DocumentItem, teamIds: string[]) {
    if (!document.isMine || busy || teamIds.length === 0) return;
    const named = (kind === "share" ? shareTargets(document) : unshareTargets(document))
      .filter((team) => teamIds.includes(team.id))
      .map((team) => team.name);
    const moveToPrivate = kind === "unshare" && unshareReturnsToPrivate(document, teamIds);
    if (
      kind === "unshare" &&
      !window.confirm(
        moveToPrivate
          ? `Remove “${document.fileName}” from ${named.join(", ")}? It will go to your Private library.`
          : `Remove “${document.fileName}” from ${named.join(", ")}?`,
      )
    ) {
      return;
    }

    setBusy({ id: document.id, kind });
    try {
      const response =
        kind === "share" ? await shareDocument(document.id, teamIds) : await unshareDocument(document.id, teamIds);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, kind === "share" ? "Could not share the file." : "Could not unshare the file.");
        setError(message);
        notify.error(kind === "share" ? "Could not share" : "Could not unshare", message);
        return;
      }
      setError(null);
      if (kind === "share") {
        notify.success("File shared", `${document.fileName} is now available in ${named.join(", ")}.`);
      } else {
        notify.success(
          "File unshared",
          moveToPrivate
            ? `${document.fileName} was removed from ${named.join(", ")} and moved to Private.`
            : `${document.fileName} was removed from ${named.join(", ")}.`,
        );
      }
      await load();
    } catch {
      const message = kind === "share" ? "Could not share the file." : "Could not unshare the file.";
      setError(message);
      notify.error(kind === "share" ? "Could not share" : "Could not unshare", message);
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } catch {
      setError("Could not reach the document service. Try again.");
    } finally {
      setRefreshing(false);
    }
  }

  const inFlight = documents.some(
    (document) =>
      document.status === "uploading" || document.status === "pending" || document.status === "processing",
  );

  useEffect(() => {
    if (!inFlight) return;
    const timer = window.setInterval(() => {
      void load();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [inFlight, load]);

  const searched = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((document) => document.fileName.toLowerCase().includes(term));
  }, [documents, query]);

  const visible = query.trim() ? searched : searched.slice(0, RECENT_LIMIT);
  const searching = query.trim().length > 0;
  const sharingDocument = documents.find((document) => document.id === sharingId) ?? null;

  return (
    <div className="animate-fade-up flex min-h-full flex-1 flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Upload a PDF or text file to Private or any team you belong to. Recent files appear below.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="self-start bg-background shadow-sm sm:self-auto"
          disabled={refreshing || loading}
          aria-busy={refreshing}
          onClick={() => void refresh()}
        >
          {refreshing ? <Spinner label="Refreshing" /> : <RefreshCw />}
          Refresh
        </Button>
      </header>

      <DocumentUpload
        teams={teams}
        defaultTeamId={privateTeamId}
        onUploaded={load}
        onUnauthorized={() => router.push("/login")}
      />

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Your uploads</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : searching
                  ? `${visible.length} match${visible.length === 1 ? "" : "es"}`
                  : documents.length === 0
                    ? "Nothing here yet"
                    : `Showing ${visible.length} of ${documents.length} recent file${documents.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by file name"
              className={`${fieldClassName} w-full pl-9`}
              aria-label="Search your uploads by name"
            />
          </label>
        </div>

        {loading ? (
          <div className="divide-y divide-border/80">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-4 px-6 py-4">
                <div className="size-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">{searching ? "No files match that name" : "No uploads yet"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {searching
                ? "Try a different file name."
                : "Drop a file above and it will appear here when it starts processing."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Teams</th>
                  <th className="px-4 py-3 font-medium">Last updated</th>
                  <th className="px-4 py-3 font-medium">Last shared with</th>
                  <th className="px-6 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {visible.map((document) => {
                  const status = resolveStatus(document.status);
                  const rowBusy = busy?.id === document.id;
                  return (
                    <tr key={document.id} className="align-middle hover:bg-muted/30">
                      <td className="w-full max-w-0 px-6 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <FileGlyph fileName={document.fileName} />
                          <p className="min-w-0 break-all font-medium whitespace-normal">{document.fileName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]} ${status === "processing" || status === "pending" || status === "uploading" ? "animate-pulse" : ""}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {document.teams.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            document.teams.map((team) => (
                              <span
                                key={team.id}
                                className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                              >
                                {team.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {formatUpdated(document.updatedAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {document.lastSharedWith}
                      </td>
                      <td className="px-6 py-4">
                        {document.isMine ? (
                        <div className="flex justify-end gap-2">
                          {status !== "uploading" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-background"
                            disabled={busy !== null && !rowBusy}
                            onClick={() => setSharingId(document.id)}
                          >
                            <Share2 />
                            Share
                          </Button>
                          ) : null}
                          {status === "failed" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="bg-background"
                              disabled={busy !== null}
                              aria-busy={rowBusy && busy?.kind === "retry"}
                              onClick={() => void runAction("retry", document)}
                            >
                              {rowBusy && busy?.kind === "retry" ? <Spinner label="Retrying" /> : <RotateCcw />}
                              Retry
                            </Button>
                          ) : null}
                          {status === "completed" || status === "failed" || status === "uploading" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={busy !== null}
                              aria-busy={rowBusy && busy?.kind === "delete"}
                              onClick={() => void runAction("delete", document)}
                            >
                              {rowBusy && busy?.kind === "delete" ? <Spinner label="Deleting" /> : <Trash2 />}
                              Delete
                            </Button>
                          ) : null}
                        </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ShareTeamsDialog
        open={Boolean(sharingDocument)}
        fileName={sharingDocument?.fileName ?? ""}
        shareTeams={sharingDocument ? shareTargets(sharingDocument) : []}
        unshareTeams={sharingDocument ? unshareTargets(sharingDocument) : []}
        pending={busy?.id === sharingDocument?.id && (busy?.kind === "share" || busy?.kind === "unshare")}
        onClose={() => setSharingId(null)}
        onShare={(teamIds) => (sharingDocument ? runShareAction("share", sharingDocument, teamIds) : Promise.resolve())}
        onUnshare={(teamIds) => (sharingDocument ? runShareAction("unshare", sharingDocument, teamIds) : Promise.resolve())}
      />
    </div>
  );
}
