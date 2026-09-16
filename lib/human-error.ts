const KNOWN: Record<string, string> = {
  "authorized user context not found": "Your session expired. Sign in again.",
  "invalid login credentials provided": "Email or password is incorrect.",
  "invalid token": "Your session expired. Sign in again.",
  "unauthorized session": "Your session expired. Sign in again.",
  "unauthorized": "Your session expired. Sign in again.",
  "forbidden": "You do not have permission to do that.",
  "bad request": "That request could not be completed. Check the details and try again.",
  "not found": "That item could not be found.",
  "internal server error": "Something went wrong. Try again.",
  "team not found": "That team could not be found.",
  "you are not a member of this group": "You are not a member of this team.",
  "invalid file name": "That file name is not allowed.",
  "document not found": "That file could not be found.",
  "no such document found": "That file could not be found.",
  "document is not uploading": "This file is not waiting to finish upload.",
  "invalid document storage url": "This file could not be uploaded. Try again.",
  "invalid object size": "That file size is not allowed. Use a file under 10MB.",
  "invalid object type": "Only PDF and plain text files are accepted.",
  "document not found in s3": "The file did not finish uploading. Try again.",
  "s3 client not initialized": "File storage is not available right now. Try again later.",
  "private team cannot be unshared": "Private files cannot be unshared this way.",
  "cannot share document with private team": "Files cannot be shared into Private. Private is only for your own library.",
  "no completed documents found": "There are no ready files to search in this team yet.",
  "no teams found": "Choose at least one team.",
  "invalid team ids": "One or more of those teams could not be used.",
  "only failed documents can be retried": "Only files that failed processing can be retried.",
  "file is required": "Choose a file to upload.",
  "user not found": "That account could not be found.",
  "old owner not found": "Your session expired. Sign in again.",
  "new owner not found": "No account was found with that email.",
  "new owner is not active": "That person cannot receive ownership right now.",
  "you cannot change ownership to yourself": "You already own this team.",
  "new owner is not a member of the team": "The new owner must already be a member of this team.",
  "private team ownership cannot be changed": "Your Private library cannot be transferred.",
  "private is a reserved team name": "“Private” is reserved. Choose a different team name.",
  "private team cannot be renamed": "Your Private library cannot be renamed.",
  "private team cannot be deleted": "Your Private library cannot be deleted.",
  "private team cannot have members": "Your Private library cannot have members.",
  "private team cannot have members removed": "Your Private library cannot have members removed.",
  "member not found": "No account was found with that email.",
  "member is not active": "That person cannot be added right now.",
  "member already in team": "That person is already on this team.",
  "member not found in team": "That person is not on this team.",
  "you cannot remove yourself from the team": "You cannot remove yourself from the team.",
  "user has teams, please delete or change owner of the teams first":
    "Transfer or delete teams you own before deleting your account.",
  "a team is required to upload": "Choose a team for this file.",
  "document id and at least one team are required": "Choose at least one team.",
  "team id and member email are required": "Team and email are required.",
  "team id is required": "A team is required.",
  "team name is required": "Enter a team name.",
  "document id is required": "A file is required.",
  "enter a question to search": "Enter a question to search.",
  "choose a team to search": "Choose a team to search.",
  "failed to upload document": "Could not upload the file. Try again.",
  "failed to share the file": "Could not share the file. Try again.",
  "failed to unshare the file": "Could not unshare the file. Try again.",
  "failed to add member": "Could not add that member. Try again.",
  "failed to remove member": "Could not remove that member. Try again.",
  "failed to update team": "Could not update the team. Try again.",
  "failed to delete team": "Could not delete the team. Try again.",
  "failed to delete document": "Could not delete the file. Try again.",
  "failed to retry document": "Could not retry that file. Try again.",
  "failed to delete user": "Could not delete your account. Try again.",
  "failed to update user": "Could not save your changes. Try again.",
  "failed to fetch documents": "Could not load your files. Try again.",
  "could not start the search": "Could not start the search. Try again.",
  "could not search right now": "Could not search right now. Try again.",
  "failed to fetch": "Could not reach the service. Try again.",
  "networkerror when attempting to fetch resource": "Could not reach the service. Try again.",
  "a file name is required": "That file name is not allowed.",
  "could not transfer ownership": "Could not transfer ownership. Try again.",
  "could not start the upload": "Could not start the upload. Try again.",
  "you cannot leave a team you own. transfer ownership first":
    "Transfer ownership before you leave this team.",
  "could not leave the team": "Could not leave the team. Try again.",
};

const TECHNICAL =
  /sqlalchemy|postgres|psycopg|econnrefused|enotfound|etimedout|traceback|statuscode|internal server error|enoent|syntaxerror|typeerror|cannot read prop|axioserror|nestjs|exception|ghcr\.io|tls handshake|undefinedtable|relation ".* does not exist|stack trace|at [a-z0-9._]+\(|failed to fetch anonymous token|net\/http|s3exception|accessdenied|signaturedoesnotmatch|nosuchbucket|xml/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function keyOf(value: string) {
  return value.trim().replace(/[.!]+$/g, "").replace(/\s+/g, " ").toLowerCase();
}

function collectMessages(value: unknown, into: string[]) {
  if (typeof value === "string" && value.trim()) {
    into.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectMessages(item, into);
    return;
  }
  if (!isRecord(value)) return;
  if ("message" in value) collectMessages(value.message, into);
  if ("error" in value && typeof value.error === "string") {
    const label = keyOf(value.error);
    if (!["bad request", "unauthorized", "forbidden", "not found", "internal server error"].includes(label)) {
      collectMessages(value.error, into);
    }
  }
  if ("errors" in value) collectMessages(value.errors, into);
}

function fromValidator(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("contentlength") && (lower.includes("greater") || lower.includes("max"))) {
    return "File exceeds the 10MB limit.";
  }
  if (lower.includes("contentlength") && (lower.includes("min") || lower.includes("not be empty"))) {
    return "Choose a non-empty file.";
  }
  if (lower.includes("contenttype")) return "Only PDF and plain text files are accepted.";
  if (lower.includes("must be an email") || lower.includes("email must be")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("should not be empty") || lower.includes("must not be empty")) {
    return "Please fill in all required fields.";
  }
  if (lower.includes("must be a string")) return "That value is not valid.";
  if (lower.includes("must be an array")) return "Choose at least one team.";
  if (lower.includes("must be a number") || lower.includes("must be an integer")) {
    return "That value is not valid.";
  }
  if (lower.includes("property") && lower.includes("should not exist")) {
    return "That request could not be completed. Refresh and try again.";
  }
  return null;
}

function looksTechnical(text: string) {
  if (TECHNICAL.test(text)) return true;
  if (text.length > 180) return true;
  if (/[{};<>]/.test(text) && /error|exception|stack/i.test(text)) return true;
  if (/\b[A-Z][a-zA-Z]+Exception\b/.test(text)) return true;
  if (/\b(ECONN|ENOT|EPERM|EACCES)\b/.test(text)) return true;
  return false;
}

function polish(text: string) {
  const trimmed = text.trim().replace(/[.!]+$/g, "");
  if (!trimmed) return "";
  const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${sentence}.`;
}

export function humanizeError(payload: unknown, fallback: string): string {
  const raw: string[] = [];
  collectMessages(payload, raw);
  if (typeof payload === "string") raw.push(payload);

  const mapped: string[] = [];
  for (const part of raw) {
    const known = KNOWN[keyOf(part)];
    if (known) {
      mapped.push(known);
      continue;
    }
    const validated = fromValidator(part);
    if (validated) {
      mapped.push(validated);
      continue;
    }
    if (looksTechnical(part)) continue;
    const readable = polish(part);
    if (readable) mapped.push(readable);
  }

  const unique = [...new Set(mapped)];
  if (unique.length > 0) return unique.join(" ");
  return fallback;
}

export function humanizeHttpError(status: number, payload: unknown, fallback: string): string {
  if (status === 401) return "Your session expired. Sign in again.";
  if (status === 403) return humanizeError(payload, "You do not have permission to do that.");
  if (status === 404) return humanizeError(payload, "That item could not be found.");
  if (status === 413) return "That file is too large. Use a file under 10MB.";
  if (status >= 500) return humanizeError(payload, fallback);
  return humanizeError(payload, fallback);
}

export function humanizeNetworkError(fallback: string): string {
  return fallback;
}
