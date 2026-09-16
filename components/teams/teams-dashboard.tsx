"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { File, FileText, Lock, LogOut, Pencil, Plus, RefreshCw, RotateCcw, Search, Share2, Trash2, UserMinus, Users } from "lucide-react";
import {
  addTeamMember,
  changeTeamOwner,
  createTeam,
  deleteDocument,
  deleteTeam,
  getTeams,
  leaveTeam,
  logout,
  removeTeamMember,
  retryDocument,
  shareDocument,
  unshareDocument,
  updateTeam,
} from "@/lib/api";
import { DocumentUpload } from "@/components/documents/document-upload";
import { ShareTeamsDialog } from "@/components/documents/share-teams-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fieldClassName } from "@/components/auth/fields";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { notify } from "@/lib/stores/toast-store";
import { humanizeError, humanizeHttpError } from "@/lib/human-error";

type DocumentStatus = "uploading" | "pending" | "processing" | "completed" | "failed";

type SharedTeam = { id: string; name: string; isPrivate: boolean };

type TeamDocument = {
  id: string;
  fileName: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  uploadedByName: string;
  uploadedByEmail: string | null;
  sharedTeams: SharedTeam[];
};

type TeamMember = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  joinedAt: string | null;
  isOwner: boolean;
  isYou: boolean;
};

type TeamItem = {
  id: string;
  name: string;
  isOwner: boolean;
  isPrivate: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  joinedAt: string | null;
  members: TeamMember[];
  documents: TeamDocument[];
};

type BusyAction = { id: string; kind: "delete" | "retry" | "share" | "unshare" };

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

function isMember(value: unknown): value is TeamMember {
  return !!value && typeof value === "object" && typeof (value as TeamMember).email === "string";
}

function isSharedTeam(value: unknown): value is SharedTeam {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as SharedTeam).id === "string" &&
    typeof (value as SharedTeam).name === "string"
  );
}

function isDocument(value: unknown): value is TeamDocument {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as TeamDocument).id === "string" &&
    typeof (value as TeamDocument).fileName === "string" &&
    typeof (value as TeamDocument).status === "string"
  );
}

function isTeam(value: unknown): value is TeamItem {
  if (!value || typeof value !== "object") return false;
  const item = value as TeamItem;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.isOwner === "boolean" &&
    typeof item.isPrivate === "boolean" &&
    Array.isArray(item.documents)
  );
}

function formatUpdated(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function memberName(member: TeamMember) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  return name || member.email;
}

function memberInitials(member: TeamMember) {
  const name = memberName(member);
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function sortedMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
    if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
    return memberName(a).localeCompare(memberName(b));
  });
}

function uploaderLabel(document: TeamDocument) {
  if (document.isMine) return "You";
  return document.uploadedByName || document.uploadedByEmail || "Unknown";
}

function unshareReturnsToPrivate(document: TeamDocument, teamIds: string[]) {
  const removing = new Set(teamIds);
  return document.sharedTeams.every((team) => team.isPrivate || removing.has(team.id));
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

export function TeamsDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [fileQuery, setFileQuery] = useState("");
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [teamConfirm, setTeamConfirm] = useState<
    | { kind: "delete" }
    | { kind: "leave" }
    | { kind: "remove"; email: string; memberName: string }
    | { kind: "transfer"; email: string; ownerName: string }
    | null
  >(null);

  const load = useCallback(
    async (preferId?: string | null) => {
      const response = await getTeams();
      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        await logout().catch(() => undefined);
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(humanizeHttpError(response.status, payload, "Could not load teams."));
        return;
      }

      setError(null);
      const nextTeams =
        payload && typeof payload === "object" && Array.isArray((payload as { teams?: unknown }).teams)
          ? (payload as { teams: unknown[] }).teams.filter(isTeam).map((team) => ({
              ...team,
              joinedAt: typeof team.joinedAt === "string" ? team.joinedAt : null,
              members: Array.isArray(team.members) ? team.members.filter(isMember) : [],
              documents: team.documents.filter(isDocument).map((document) => ({
                ...document,
                status: resolveStatus(document.status),
                isMine: document.isMine === true,
                uploadedByName:
                  typeof document.uploadedByName === "string" && document.uploadedByName.trim()
                    ? document.uploadedByName
                    : document.isMine
                      ? "You"
                      : "Unknown",
                uploadedByEmail: typeof document.uploadedByEmail === "string" ? document.uploadedByEmail : null,
                sharedTeams: Array.isArray(document.sharedTeams)
                  ? document.sharedTeams.filter(isSharedTeam).map((team) => ({
                      id: team.id,
                      name: team.name,
                      isPrivate: team.isPrivate === true,
                    }))
                  : [],
              })),
            }))
          : [];

      setTeams(nextTeams);
      setSelectedId((current) => {
        const wanted = preferId ?? current;
        if (wanted && nextTeams.some((team) => team.id === wanted)) return wanted;
        return nextTeams[0]?.id ?? null;
      });
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    async function firstLoad() {
      setLoading(true);
      try {
        await load();
      } catch {
        if (!cancelled) setError("Could not reach the team service. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    firstLoad();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const selected = useMemo(
    () => teams.find((team) => team.id === selectedId) ?? null,
    [teams, selectedId],
  );
  const createdTeams = teams.filter((team) => team.isOwner);
  const memberTeams = teams.filter((team) => !team.isOwner);
  const canManage = Boolean(selected && selected.isOwner && !selected.isPrivate);
  const canLeave = Boolean(selected && !selected.isPrivate && !selected.isOwner);
  const visibleDocuments = useMemo(() => {
    if (!selected) return [];
    const query = fileQuery.trim().toLowerCase();
    if (!query) return selected.documents;
    return selected.documents.filter((document) => document.fileName.toLowerCase().includes(query));
  }, [selected, fileQuery]);
  const searching = fileQuery.trim().length > 0;
  const joinedLabel = formatUpdated(selected?.joinedAt ?? null);
  const sharingDocument = selected?.documents.find((document) => document.id === sharingId) ?? null;
  const inFlight = selected?.documents.some(
    (document) =>
      document.status === "uploading" || document.status === "pending" || document.status === "processing",
  );

  useEffect(() => {
    setFileQuery("");
    setSharingId(null);
    setNewOwnerEmail("");
    setTeamConfirm(null);
  }, [selectedId]);

  useEffect(() => {
    if (!inFlight) return;
    const timer = window.setInterval(() => {
      void load(selectedId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [inFlight, load, selectedId]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } catch {
      setError("Could not reach the team service. Try again.");
    } finally {
      setRefreshing(false);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    try {
      const response = await createTeam(name);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not create team.");
        setError(message);
        notify.error("Could not create team", message);
        return;
      }
      const createdId =
        payload && typeof payload === "object" && typeof (payload as { id?: unknown }).id === "string"
          ? (payload as { id: string }).id
          : null;
      setNewName("");
      setEditing(false);
      notify.success("Team created", name);
      await load(createdId);
    } catch {
      const message = "Could not create team.";
      setError(message);
      notify.error("Could not create team", message);
    } finally {
      setCreating(false);
    }
  }

  async function onSaveName(event: FormEvent) {
    event.preventDefault();
    if (!selected || !canManage || saving) return;
    const name = editName.trim();
    if (!name || name === selected.name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await updateTeam(selected.id, name);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not rename team.");
        setError(message);
        notify.error("Could not rename team", message);
        return;
      }
      setEditing(false);
      notify.success("Team renamed", name);
      await load(selected.id);
    } catch {
      const message = "Could not rename team.";
      setError(message);
      notify.error("Could not rename team", message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selected || !canManage || deleting) return;
    setTeamConfirm({ kind: "delete" });
  }

  async function confirmDeleteTeam() {
    if (!selected || !canManage || deleting) return;

    setDeleting(true);
    try {
      const response = await deleteTeam(selected.id);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not delete team.");
        setError(message);
        notify.error("Could not delete team", message);
        return;
      }
      notify.success("Team deleted", selected.name);
      setEditing(false);
      setTeamConfirm(null);
      await load(null);
    } catch {
      const message = "Could not delete team.";
      setError(message);
      notify.error("Could not delete team", message);
    } finally {
      setDeleting(false);
    }
  }

  async function onAddMember(event: FormEvent) {
    event.preventDefault();
    if (!selected || !canManage || addingMember) return;
    const email = memberEmail.trim();
    if (!email) return;

    setAddingMember(true);
    try {
      const response = await addTeamMember(selected.id, email);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not add member.");
        setError(message);
        notify.error("Could not add member", message);
        return;
      }
      setMemberEmail("");
      notify.success("Member added", email);
      await load(selected.id);
    } catch {
      const message = "Could not add member.";
      setError(message);
      notify.error("Could not add member", message);
    } finally {
      setAddingMember(false);
    }
  }

  async function onRemoveMember(member: TeamMember) {
    if (!selected || !canManage || removingEmail) return;
    setTeamConfirm({ kind: "remove", email: member.email, memberName: memberName(member) });
  }

  async function confirmRemoveMember() {
    if (!selected || !canManage || removingEmail || teamConfirm?.kind !== "remove") return;
    const member = selected.members.find((row) => row.email === teamConfirm.email);
    if (!member) return;

    setRemovingEmail(member.email);
    try {
      const response = await removeTeamMember(selected.id, member.email);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not remove member.");
        setError(message);
        notify.error("Could not remove member", message);
        return;
      }
      notify.success("Member removed", member.email);
      setTeamConfirm(null);
      await load(selected.id);
    } catch {
      const message = "Could not remove member.";
      setError(message);
      notify.error("Could not remove member", message);
    } finally {
      setRemovingEmail(null);
    }
  }

  async function onTransferOwner(event: FormEvent) {
    event.preventDefault();
    if (!selected || !canManage || transferring) return;
    const email = newOwnerEmail.trim();
    const nextOwner = selected.members.find((member) => member.email === email);
    if (!email || !nextOwner) return;
    setTeamConfirm({ kind: "transfer", email, ownerName: memberName(nextOwner) });
  }

  async function confirmTransferOwner() {
    if (!selected || !canManage || transferring || teamConfirm?.kind !== "transfer") return;
    const email = teamConfirm.email;
    const nextOwner = selected.members.find((member) => member.email === email);
    if (!nextOwner) return;

    setTransferring(true);
    try {
      const response = await changeTeamOwner(selected.id, email);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not transfer ownership.");
        setError(message);
        notify.error("Could not transfer ownership", message);
        return;
      }
      notify.success("Ownership transferred", `${selected.name} is now owned by ${memberName(nextOwner)}.`);
      setNewOwnerEmail("");
      setTeamConfirm(null);
      await load(selected.id);
    } catch {
      const message = "Could not transfer ownership.";
      setError(message);
      notify.error("Could not transfer ownership", message);
    } finally {
      setTransferring(false);
    }
  }

  async function onLeaveTeam() {
    if (!selected || !canLeave || leaving) return;
    setTeamConfirm({ kind: "leave" });
  }

  async function confirmLeaveTeam() {
    if (!selected || !canLeave || leaving) return;

    setLeaving(true);
    try {
      const response = await leaveTeam(selected.id);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, "Could not leave the team.");
        setError(message);
        notify.error("Could not leave team", message);
        return;
      }
      notify.success("Left team", `You left ${selected.name}.`);
      setTeamConfirm(null);
      await load();
    } catch {
      const message = "Could not leave the team.";
      setError(message);
      notify.error("Could not leave team", message);
    } finally {
      setLeaving(false);
    }
  }

  async function runFileAction(kind: "delete" | "retry", document: TeamDocument) {
    if (!document.isMine) return;
    if (kind === "delete" && !window.confirm(`Delete “${document.fileName}”? This cannot be undone.`)) {
      return;
    }

    setBusy({ id: document.id, kind });
    try {
      const response = kind === "delete" ? await deleteDocument(document.id) : await retryDocument(document.id);
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const message = humanizeError(payload, kind === "delete" ? "Could not delete file." : "Could not retry file.");
        setError(message);
        notify.error(kind === "delete" ? "Could not delete" : "Could not retry", message);
        return;
      }
      if (kind === "delete") {
        notify.success("File removed", `${document.fileName} was deleted.`);
      } else {
        notify.info("Retry started", `${document.fileName} is being processed again.`);
      }
      await load(selectedId);
    } catch {
      const message = kind === "delete" ? "Could not delete the document." : "Could not retry the document.";
      setError(message);
      notify.error(kind === "delete" ? "Could not delete" : "Could not retry", message);
    } finally {
      setBusy(null);
    }
  }

  function selectTeam(team: TeamItem) {
    setSelectedId(team.id);
    setEditing(false);
    setEditName(team.name);
    setMemberEmail("");
    setFileQuery("");
    setSharingId(null);
    setNewOwnerEmail("");
  }

  function shareTargets(document: TeamDocument) {
    const sharedIds = new Set(document.sharedTeams.map((team) => team.id));
    return teams.filter((team) => !team.isPrivate && !sharedIds.has(team.id));
  }

  function unshareTargets(document: TeamDocument) {
    return document.sharedTeams.filter((team) => !team.isPrivate);
  }

  async function runShareAction(kind: "share" | "unshare", document: TeamDocument, teamIds: string[]) {
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
      if (kind === "share") {
        notify.success(
          "File shared",
          `${document.fileName} is now available in ${named.join(", ")}.`,
        );
      } else {
        notify.success(
          "File unshared",
          moveToPrivate
            ? `${document.fileName} was removed from ${named.join(", ")} and moved to Private.`
            : `${document.fileName} was removed from ${named.join(", ")}.`,
        );
        if (teamIds.includes(selectedId ?? "")) setSharingId(null);
      }
      await load(selectedId);
    } catch {
      const message = kind === "share" ? "Could not share the file." : "Could not unshare the file.";
      setError(message);
      notify.error(kind === "share" ? "Could not share" : "Could not unshare", message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-up flex min-h-full flex-1 flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Open a team to upload files to it, manage members you own, and work with files you uploaded.
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

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-6">
          <form onSubmit={(event) => void onCreate(event)} className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm">
            <label htmlFor="new-team-name" className="text-sm font-medium">
              Create a team
            </label>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">You will be the owner. Private is reserved.</p>
            <div className="mt-4 flex gap-3">
              <input
                id="new-team-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Team name"
                maxLength={255}
                className={`${fieldClassName} min-w-0 flex-1`}
                disabled={creating}
              />
              <Button type="submit" disabled={creating || !newName.trim()} aria-busy={creating}>
                {creating ? <Spinner label="Creating team" /> : <Plus />}
                Create
              </Button>
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
            {loading ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-12 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium">No teams yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Create one to share documents.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/80">
                {createdTeams.length > 0 ? (
                  <TeamGroup title="Created by you" teams={createdTeams} selectedId={selectedId} onSelect={selectTeam} />
                ) : null}
                {memberTeams.length > 0 ? (
                  <TeamGroup title="You're a member" teams={memberTeams} selectedId={selectedId} onSelect={selectTeam} />
                ) : null}
              </div>
            )}
          </section>

          {selected && !selected.isPrivate ? (
            <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <Users className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">Members</h3>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {selected.members.length} {selected.members.length === 1 ? "person" : "people"}
                    {canManage ? " · Invite by email" : ""}
                  </p>
                </div>
              </div>

              {canManage ? (
                <form onSubmit={(event) => void onAddMember(event)} className="mt-4 flex gap-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="colleague@company.com"
                    className={`${fieldClassName} min-w-0 flex-1`}
                    disabled={addingMember}
                    aria-label="Member email"
                  />
                  <Button type="submit" size="sm" className="h-10 px-3" disabled={addingMember || !memberEmail.trim()} aria-busy={addingMember}>
                    {addingMember ? <Spinner label="Adding member" /> : <Plus />}
                    Add
                  </Button>
                </form>
              ) : null}

              {selected.members.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">No members listed yet.</p>
              ) : (
                <ul className="mt-4 space-y-1">
                  {sortedMembers(selected.members).map((member) => {
                    const canRemove = canManage && !member.isYou && !member.isOwner;
                    return (
                      <li
                        key={member.email}
                        className="flex items-center gap-3 rounded-xl px-1.5 py-2 hover:bg-muted/50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                          {memberInitials(member)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium">{memberName(member)}</p>
                            {member.isYou ? (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                                You
                              </span>
                            ) : null}
                            {member.isOwner ? (
                              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.65rem] font-medium tracking-wide text-primary uppercase">
                                Owner
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {canRemove ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={removingEmail !== null}
                            aria-busy={removingEmail === member.email}
                            onClick={() => void onRemoveMember(member)}
                            aria-label={`Remove ${memberName(member)}`}
                          >
                            {removingEmail === member.email ? (
                              <Spinner label={`Removing ${memberName(member)}`} />
                            ) : (
                              <UserMinus />
                            )}
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              {canLeave ? (
                <div className="mt-4 rounded-2xl bg-muted/45 px-4 py-3">
                  <p className="text-sm font-medium">Leave this team</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    You will lose access to shared files. Files you uploaded that are only on this team will return to Private.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3 h-10 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={leaving}
                    aria-busy={leaving}
                    onClick={() => void onLeaveTeam()}
                  >
                    {leaving ? <Spinner label="Leaving team" /> : <LogOut />}
                    Leave team
                  </Button>
                </div>
              ) : null}

              {canManage ? (
                <form onSubmit={(event) => void onTransferOwner(event)} className="mt-4 rounded-2xl bg-muted/45 px-4 py-3">
                  <p className="text-sm font-medium">Transfer ownership</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    The new owner must already be on this team.
                  </p>
                  {selected.members.filter((member) => !member.isOwner).length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">Add a member first.</p>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <select
                        value={newOwnerEmail}
                        onChange={(event) => setNewOwnerEmail(event.target.value)}
                        disabled={transferring}
                        className={`${fieldClassName} min-w-0 flex-1`}
                        aria-label="New owner"
                      >
                        <option value="">Choose a member</option>
                        {sortedMembers(selected.members)
                          .filter((member) => !member.isOwner)
                          .map((member) => (
                            <option key={member.email} value={member.email}>
                              {memberName(member)}
                            </option>
                          ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline" className="h-10 bg-background" disabled={transferring || !newOwnerEmail} aria-busy={transferring}>
                        {transferring ? <Spinner label="Transferring ownership" /> : null}
                        Transfer
                      </Button>
                    </div>
                  )}
                </form>
              ) : null}
            </section>
          ) : null}
        </aside>

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
          {!selected ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">{loading ? "Loading teams…" : "Select a team"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading ? "Fetching the teams you belong to." : "Choose a team on the left to see its documents."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-border/80 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {editing && canManage ? (
                    <form onSubmit={(event) => void onSaveName(event)} className="flex max-w-xl gap-3">
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className={`${fieldClassName} min-w-0 flex-1`}
                        maxLength={255}
                        aria-label="Team name"
                        disabled={saving}
                        autoFocus
                      />
                      <Button type="submit" size="sm" disabled={saving || !editName.trim()} aria-busy={saving}>
                        {saving ? <Spinner label="Saving team name" /> : null}
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => {
                          setEditing(false);
                          setEditName(selected.name);
                        }}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">{selected.name}</h2>
                        {selected.isPrivate ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <Lock className="size-3" />
                            Private
                          </span>
                        ) : selected.isOwner ? (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                            Created by you
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Member</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selected.documents.length} file{selected.documents.length === 1 ? "" : "s"}
                        {joinedLabel ? ` · Joined ${joinedLabel}` : ""}
                      </p>
                    </>
                  )}
                </div>
                {canManage && !editing ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-background"
                      onClick={() => {
                        setEditName(selected.name);
                        setEditing(true);
                      }}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleting}
                      aria-busy={deleting}
                      onClick={() => void onDelete()}
                    >
                      {deleting ? <Spinner label="Deleting team" /> : <Trash2 />}
                      Delete
                    </Button>
                  </div>
                ) : canLeave ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={leaving}
                    aria-busy={leaving}
                    onClick={() => void onLeaveTeam()}
                  >
                    {leaving ? <Spinner label="Leaving team" /> : <LogOut />}
                    Leave
                  </Button>
                ) : null}
              </div>

              <div className="border-b border-border/80 px-6 py-5">
                <DocumentUpload
                  teams={[{ id: selected.id, name: selected.name }]}
                  defaultTeamId={selected.id}
                  lockedTeamId={selected.id}
                  compact
                  onUploaded={() => load(selected.id)}
                  onUnauthorized={() => router.push("/login")}
                />
              </div>

              {selected.documents.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm font-medium">No files in this team</p>
                  <p className="mt-2 text-sm text-muted-foreground">Upload a PDF or text file above to add it to {selected.name}.</p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col gap-4 border-b border-border/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Files</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {searching
                          ? `${visibleDocuments.length} match${visibleDocuments.length === 1 ? "" : "es"}`
                          : `${selected.documents.length} file${selected.documents.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <label className="relative block w-full sm:max-w-md">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="search"
                        value={fileQuery}
                        onChange={(event) => setFileQuery(event.target.value)}
                        placeholder="Search by file name"
                        className={`${fieldClassName} w-full pl-9`}
                        aria-label={`Search files in ${selected.name}`}
                      />
                    </label>
                  </div>
                  {visibleDocuments.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <p className="text-sm font-medium">No files match “{fileQuery.trim()}”</p>
                      <p className="mt-2 text-sm text-muted-foreground">Try a different name, or clear the search to see every file.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead className="border-b border-border/80 bg-muted/40 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          <tr>
                            <th className="px-6 py-3 font-medium">File</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Last updated</th>
                            <th className="px-6 py-3 font-medium">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/80">
                          {visibleDocuments.map((document) => {
                            const status = resolveStatus(document.status);
                            const rowBusy = busy?.id === document.id;
                            const otherShares = document.sharedTeams.filter((team) => team.id !== selected.id);
                            return (
                                <tr key={document.id} className="align-middle hover:bg-muted/30">
                                  <td className="w-full max-w-0 px-6 py-4">
                                    <div className="flex min-w-0 items-start gap-3">
                                      <FileGlyph fileName={document.fileName} />
                                      <div className="min-w-0">
                                        <p className="min-w-0 break-all font-medium whitespace-normal">{document.fileName}</p>
                                        <p className="text-xs break-all text-muted-foreground whitespace-normal">
                                          Uploaded by {uploaderLabel(document)}
                                          {document.isMine && otherShares.length > 0
                                            ? ` · Shared with ${otherShares.map((team) => team.name).join(", ")}`
                                            : ""}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]} ${
                                        status === "processing" || status === "pending" || status === "uploading"
                                          ? "animate-pulse"
                                          : ""
                                      }`}
                                    >
                                      {STATUS_LABEL[status]}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                    {formatUpdated(document.updatedAt) ?? "—"}
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
                                            onClick={() => void runFileAction("retry", document)}
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
                                            onClick={() => void runFileAction("delete", document)}
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
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(teamConfirm && selected)}
        title="Are you sure?"
        description={
          !selected || !teamConfirm
            ? ""
            : teamConfirm.kind === "delete"
              ? `Delete “${selected.name}”? Documents that only belong to this team move to Private. This cannot be undone.`
              : teamConfirm.kind === "leave"
                ? `Leave “${selected.name}”? You will lose access to shared files. Files you uploaded that are only on this team will return to Private.`
                : teamConfirm.kind === "remove"
                  ? `Remove ${teamConfirm.memberName} from “${selected.name}”? Their files that are only on this team will return to Private.`
                  : `Transfer “${selected.name}” to ${teamConfirm.ownerName}? You will stay as a member and your files stay on this team.`
        }
        confirmLabel={
          teamConfirm?.kind === "delete"
            ? "Delete team"
            : teamConfirm?.kind === "leave"
              ? "Leave team"
              : teamConfirm?.kind === "remove"
                ? "Remove member"
                : "Transfer ownership"
        }
        pending={deleting || leaving || transferring || removingEmail !== null}
        pendingLabel={
          teamConfirm?.kind === "delete"
            ? "Deleting team"
            : teamConfirm?.kind === "leave"
              ? "Leaving team"
              : teamConfirm?.kind === "remove"
                ? "Removing member"
                : "Transferring ownership"
        }
        onCancel={() => {
          if (deleting || leaving || transferring || removingEmail) return;
          setTeamConfirm(null);
        }}
        onConfirm={() => {
          if (teamConfirm?.kind === "delete") void confirmDeleteTeam();
          else if (teamConfirm?.kind === "leave") void confirmLeaveTeam();
          else if (teamConfirm?.kind === "remove") void confirmRemoveMember();
          else if (teamConfirm?.kind === "transfer") void confirmTransferOwner();
        }}
      />
      <ShareTeamsDialog
        open={Boolean(sharingDocument)}
        fileName={sharingDocument?.fileName ?? ""}
        shareTeams={sharingDocument ? shareTargets(sharingDocument) : []}
        unshareTeams={sharingDocument ? unshareTargets(sharingDocument) : []}
        currentTeamId={selected?.id}
        pending={busy?.id === sharingDocument?.id && (busy?.kind === "share" || busy?.kind === "unshare")}
        onClose={() => setSharingId(null)}
        onShare={(teamIds) => (sharingDocument ? runShareAction("share", sharingDocument, teamIds) : Promise.resolve())}
        onUnshare={(teamIds) => (sharingDocument ? runShareAction("unshare", sharingDocument, teamIds) : Promise.resolve())}
      />
    </div>
  );
}

function TeamGroup({
  title,
  teams,
  selectedId,
  onSelect,
}: {
  title: string;
  teams: TeamItem[];
  selectedId: string | null;
  onSelect: (team: TeamItem) => void;
}) {
  return (
    <div>
      <p className="px-3 pt-4 pb-2 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul className="space-y-0.5 p-2.5">
        {teams.map((team) => {
          const active = team.id === selectedId;
          const joined = formatUpdated(team.joinedAt);
          return (
            <li key={team.id}>
              <button
                type="button"
                onClick={() => onSelect(team)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? "bg-accent font-medium text-primary" : "text-foreground hover:bg-muted/70"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    {team.isPrivate ? <Lock className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                    <span className="truncate">{team.name}</span>
                  </span>
                  {joined ? <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">Joined {joined}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{team.documents.length}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
