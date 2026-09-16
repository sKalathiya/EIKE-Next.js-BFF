const API_PREFIX = "/api/v1";

export async function login(email: string, password: string) {
  return fetch(`${API_PREFIX}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetch(`${API_PREFIX}/auth/logout`, {
    method: "POST",
  });
}

export async function register(firstName: string, lastName: string, email: string, password: string) {
  return fetch(`${API_PREFIX}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
}

export async function getDocuments() {
  return fetch(`${API_PREFIX}/document/list`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function getLibrary() {
  return fetch(`${API_PREFIX}/document/library`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function presignDocument(input: {
  teamId: string;
  fileName: string;
  contentType: string;
  contentLength: number;
}) {
  return fetch(`${API_PREFIX}/document/presign`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: input.teamId,
      fileName: input.fileName,
      contentType: input.contentType,
      contentLength: input.contentLength,
    }),
  });
}

export async function completeDocumentUpload(id: string) {
  return fetch(`${API_PREFIX}/document/complete`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function deleteDocument(id: string) {
  return fetch(`${API_PREFIX}/document/delete?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function retryDocument(id: string) {
  return fetch(`${API_PREFIX}/document/retry?id=${encodeURIComponent(id)}`, {
    method: "POST",
  });
}

export async function getUser() {
  return fetch(`${API_PREFIX}/user/me`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function updateUser(body: { firstName?: string; lastName?: string; email?: string }) {
  return fetch(`${API_PREFIX}/user/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteUser() {
  return fetch(`${API_PREFIX}/user/delete`, {
    method: "DELETE",
  });
}

export async function searchDocuments(query: string, teamId: string, signal?: AbortSignal) {
  return fetch(`${API_PREFIX}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, team_id: teamId }),
    signal,
  });
}

export async function getTeams() {
  return fetch(`${API_PREFIX}/team`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function createTeam(name: string) {
  return fetch(`${API_PREFIX}/team`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function updateTeam(id: string, name: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteTeam(id: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
}

export async function addTeamMember(id: string, email: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}/members`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function removeTeamMember(id: string, email: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}/members`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function shareDocument(id: string, teamIds: string[]) {
  return fetch(`${API_PREFIX}/document/share`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, team_ids: teamIds }),
  });
}

export async function unshareDocument(id: string, teamIds: string[]) {
  return fetch(`${API_PREFIX}/document/unshare`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, team_ids: teamIds }),
  });
}

export async function changeTeamOwner(id: string, email: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}/owner`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function leaveTeam(id: string) {
  return fetch(`${API_PREFIX}/team/${encodeURIComponent(id)}/leave`, {
    method: "POST",
    credentials: "same-origin",
  });
}