"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { completeDocumentUpload, presignDocument } from "@/lib/api";
import { fieldClassName } from "@/components/auth/fields";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/lib/stores/toast-store";
import { humanizeError, humanizeHttpError } from "@/lib/human-error";

const MAX_BYTES = 10 * 1024 * 1024;
const PRIVATE_TEAM_NAME = "Private";

type TeamRef = { id: string; name: string };

function isAllowedFile(file: File) {
  if (file.type === "application/pdf" || file.type === "text/plain") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".txt");
}

function contentTypeFor(file: File) {
  if (file.type === "application/pdf" || file.type === "text/plain") return file.type;
  return file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain";
}

function safeFileName(file: File) {
  const name = file.name.split(/[/\\]/).pop()?.trim() ?? "";
  if (!name || name.includes("..")) return "";
  return name;
}

type UploadPhase = "idle" | "presign" | "put" | "complete";

type DocumentUploadProps = {
  teams: TeamRef[];
  defaultTeamId: string | null;
  lockedTeamId?: string | null;
  compact?: boolean;
  onUploaded: () => Promise<void>;
  onUnauthorized: () => void;
};

export function DocumentUpload({
  teams,
  defaultTeamId,
  lockedTeamId,
  compact = false,
  onUploaded,
  onUnauthorized,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState(lockedTeamId ?? defaultTeamId ?? "");
  const locked = Boolean(lockedTeamId);
  const pending = phase !== "idle";

  useEffect(() => {
    if (lockedTeamId) {
      setTeamId(lockedTeamId);
      return;
    }
    if (teamId && teams.some((team) => team.id === teamId)) return;
    const privateTeam = teams.find((team) => team.name === PRIVATE_TEAM_NAME);
    setTeamId(defaultTeamId || privateTeam?.id || teams[0]?.id || "");
  }, [defaultTeamId, lockedTeamId, teams, teamId]);

  const selectedTeam = teams.find((team) => team.id === teamId);
  const ready = Boolean(teamId);

  function fail(message: string) {
    setError(message);
    notify.error("Upload failed", message);
  }

  async function submitFile(file: File) {
    const fileName = safeFileName(file);
    if (!fileName) {
      fail("That file name is not allowed.");
      return;
    }
    if (!isAllowedFile(file)) {
      fail("Only PDF and plain text files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      fail("File exceeds the 10MB limit.");
      return;
    }
    if (!teamId) {
      fail("Choose a team for this file.");
      return;
    }

    const contentType = contentTypeFor(file);
    setError(null);
    setPhase("presign");
    try {
      const presignResponse = await presignDocument({
        teamId,
        fileName,
        contentType,
        contentLength: file.size,
      });
      const presignPayload: unknown = await presignResponse.json().catch(() => null);
      if (presignResponse.status === 401) {
        onUnauthorized();
        return;
      }
      if (!presignResponse.ok) {
        fail(humanizeHttpError(presignResponse.status, presignPayload, "Could not start the upload."));
        return;
      }

      const uploadUrl =
        presignPayload &&
        typeof presignPayload === "object" &&
        typeof (presignPayload as { uploadUrl?: unknown }).uploadUrl === "string"
          ? (presignPayload as { uploadUrl: string }).uploadUrl
          : "";
      const documentId =
        presignPayload &&
        typeof presignPayload === "object" &&
        typeof (presignPayload as { id?: unknown }).id === "string"
          ? (presignPayload as { id: string }).id
          : "";
      if (!uploadUrl || !documentId) {
        fail("Could not start the upload.");
        return;
      }

      setPhase("put");
      await onUploaded().catch(() => undefined);
      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putResponse.ok) {
        fail("The file could not be stored. Try again.");
        return;
      }

      setPhase("complete");
      const completeResponse = await completeDocumentUpload(documentId);
      const completePayload: unknown = await completeResponse.json().catch(() => null);
      if (completeResponse.status === 401) {
        onUnauthorized();
        return;
      }
      if (!completeResponse.ok) {
        fail(
          humanizeHttpError(
            completeResponse.status,
            completePayload,
            "The file reached storage but could not be finished. Try uploading again.",
          ),
        );
        return;
      }

      notify.success("File uploaded", `${file.name} is being prepared for ${selectedTeam?.name ?? "your team"}.`);
      await onUploaded();
    } catch (caught) {
      fail(
        humanizeError(
          caught instanceof Error ? caught.message : null,
          "Could not reach storage. Check your connection and try again.",
        ),
      );
    } finally {
      setPhase("idle");
    }
  }

  function takeFile(files: FileList | null) {
    const file = files?.[0];
    if (file) void submitFile(file);
  }

  const statusCopy =
    phase === "presign"
      ? "Preparing a secure upload…"
      : phase === "put"
        ? "Uploading your file. This may take a moment."
        : phase === "complete"
          ? "Finishing up…"
          : `or drag and drop a PDF or .txt file here. It will go to ${selectedTeam?.name ?? "the selected team"}. Maximum 10MB.`;

  return (
    <div className="flex flex-col gap-4">
      {locked ? (
        <p className="text-sm font-medium">
          Upload to <span className="text-foreground">{selectedTeam?.name ?? "this team"}</span>
        </p>
      ) : (
        <label className="flex max-w-md flex-col gap-1.5 text-sm font-medium">
          Upload to
          <select
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            disabled={pending || teams.length === 0}
            className={fieldClassName}
            aria-label="Team to upload this file to"
          >
            {teams.length === 0 ? (
              <option value="">No teams available</option>
            ) : (
              teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name === PRIVATE_TEAM_NAME ? "Private (your library)" : team.name}
                </option>
              ))
            )}
          </select>
        </label>
      )}

      <label
        className={`group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center shadow-sm transition-all outline-none select-none ${
          compact ? "py-6 sm:py-7" : "py-10 sm:py-12"
        } ${pending ? "pointer-events-none opacity-70" : ""} ${
          dragging
            ? "border-foreground bg-background shadow-md"
            : "border-border/80 bg-background hover:border-foreground/40 hover:bg-muted/30 active:scale-[0.995]"
        } has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50`}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!pending) takeFile(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,text/plain,.pdf,.txt"
          className="sr-only"
          disabled={pending || !ready}
          onChange={(event) => {
            takeFile(event.target.files);
            event.target.value = "";
          }}
        />
        <span className={`flex size-12 items-center justify-center rounded-full bg-muted text-foreground transition-all group-hover:bg-background group-active:bg-background ${dragging ? "scale-110" : ""}`}>
          {pending ? (
            <Spinner size="lg" label="Uploading file" />
          ) : (
            <Upload className="size-5 transition-transform group-hover:-translate-y-0.5" />
          )}
        </span>
        <p className={`mt-4 font-semibold ${compact ? "text-sm" : "text-base"}`}>
          {pending ? "Just a moment" : dragging ? "Drop to upload" : "Click to upload"}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{statusCopy}</p>
        {!pending ? (
          <span className="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform group-hover:translate-y-px group-active:translate-y-0.5">
            Choose file
          </span>
        ) : null}
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
