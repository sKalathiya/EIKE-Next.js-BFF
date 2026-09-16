import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;
const PRIVATE_TEAM_NAME = "Private";

type TeamDocument = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  uploadedByName: string;
  uploadedByEmail: string | null;
  sharedTeams: { id: string; name: string; isPrivate: boolean }[];
};

type TeamMember = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  joinedAt: string | null;
  isOwner: boolean;
  isYou: boolean;
};

type DashboardTeam = {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function jwtPayload(token: string): { id: string | null; email: string | null } {
  try {
    const payload = token.split(".")[1];
    if (!payload) return { id: null, email: null };
    const json: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!isRecord(json)) return { id: null, email: null };
    return {
      id: typeof json.id === "string" && json.id ? json.id : null,
      email: typeof json.email === "string" && json.email ? json.email.toLowerCase() : null,
    };
  } catch {
    return { id: null, email: null };
  }
}

function asDateString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function teamOwnerId(value: Record<string, unknown>): string | null {
  if (typeof value.ownerId === "string" && value.ownerId) return value.ownerId;
  if (isRecord(value.owner) && typeof value.owner.id === "string" && value.owner.id) {
    return value.owner.id;
  }
  return null;
}

function documentOwnerId(value: Record<string, unknown>): string | null {
  if (typeof value.userId === "string" && value.userId) return value.userId;
  if (isRecord(value.user) && typeof value.user.id === "string" && value.user.id) {
    return value.user.id;
  }
  return null;
}

function teamOwnerEmail(value: Record<string, unknown>): string | null {
  if (isRecord(value.owner) && typeof value.owner.email === "string" && value.owner.email) {
    return value.owner.email.toLowerCase();
  }
  return null;
}

function asMember(
  value: unknown,
  viewerEmail: string | null,
  ownerId: string | null,
  ownerEmail: string | null,
  viewerIsOwner: boolean,
): TeamMember | null {
  if (!isRecord(value)) return null;
  const user = isRecord(value.user) ? value.user : value;
  const email =
    typeof user.email === "string" && user.email
      ? user.email
      : typeof value.email === "string" && value.email
        ? value.email
        : "";
  if (!email) return null;
  const memberUserId =
    typeof user.id === "string" && user.id
      ? user.id
      : typeof value.userId === "string" && value.userId
        ? value.userId
        : null;
  const isYou = Boolean(viewerEmail && email.toLowerCase() === viewerEmail);
  return {
    email,
    firstName: typeof user.firstName === "string" ? user.firstName : null,
    lastName: typeof user.lastName === "string" ? user.lastName : null,
    joinedAt: asDateString(value.joinedAt),
    isOwner:
      value.isOwner === true ||
      Boolean(ownerId && memberUserId && ownerId === memberUserId) ||
      Boolean(ownerEmail && email.toLowerCase() === ownerEmail) ||
      Boolean(viewerIsOwner && isYou),
    isYou,
  };
}

function asTeam(
  value: unknown,
  userId: string | null,
  viewerEmail: string | null,
): Omit<DashboardTeam, "documents"> | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const name = value.name;
  if (typeof id !== "string" || !id || typeof name !== "string" || !name) return null;
  const ownerId = teamOwnerId(value);
  const ownerEmail = teamOwnerEmail(value);
  const isOwner = Boolean(userId && ownerId && ownerId === userId);
  const isPrivate = name === PRIVATE_TEAM_NAME;
  const members = Array.isArray(value.members)
    ? value.members
        .map((member) => asMember(member, viewerEmail, ownerId, ownerEmail, isOwner))
        .filter((member): member is TeamMember => member !== null)
    : [];
  return {
    id,
    name,
    isOwner,
    isPrivate,
    createdAt: asDateString(value.createdAt),
    updatedAt: asDateString(value.updatedAt),
    joinedAt: asDateString(value.joinedAt),
    members,
  };
}

function uploaderFromDocument(value: Record<string, unknown>, isMine: boolean): { name: string; email: string | null } {
  const user = isRecord(value.user) ? value.user : null;
  const email = user && typeof user.email === "string" && user.email ? user.email : null;
  const firstName = user && typeof user.firstName === "string" ? user.firstName.trim() : "";
  const lastName = user && typeof user.lastName === "string" ? user.lastName.trim() : "";
  const name = [firstName, lastName].filter(Boolean).join(" ");
  if (isMine) {
    return { name: name || "You", email };
  }
  return { name: name || email || "Unknown", email };
}

function asDocument(value: unknown, userId: string | null, viewerEmail: string | null): TeamDocument | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const fileName = value.fileName;
  const status = value.status;
  if (typeof id !== "string" || !id || typeof fileName !== "string" || typeof status !== "string") {
    return null;
  }
  const createdAt = asDateString(value.createdAt) ?? asDateString(value.updatedAt) ?? new Date(0).toISOString();
  const updatedAt = asDateString(value.updatedAt) ?? createdAt;
  const ownerId = documentOwnerId(value);
  const user = isRecord(value.user) ? value.user : null;
  const email = user && typeof user.email === "string" && user.email ? user.email : null;
  const isMine =
    Boolean(userId && ownerId && ownerId === userId) ||
    Boolean(viewerEmail && email && email.toLowerCase() === viewerEmail);
  const uploadedBy = uploaderFromDocument(value, isMine);
  return {
    id,
    fileName,
    status,
    createdAt,
    updatedAt,
    isMine,
    uploadedByName: uploadedBy.name,
    uploadedByEmail: uploadedBy.email,
    sharedTeams: [],
  };
}

async function gatewayJson(path: string, token: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers });
  const payload: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

function sortTeams(a: DashboardTeam, b: DashboardTeam) {
  if (a.isPrivate !== b.isPrivate) return a.isPrivate ? -1 : 1;
  if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
  return a.name.localeCompare(b.name);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id: userId, email: viewerEmail } = jwtPayload(token);
    const teamsResult = await gatewayJson("/api/v1/team/user", token);
    if (teamsResult.status === 401) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }
    if (!teamsResult.ok) {
      return NextResponse.json(
        isRecord(teamsResult.payload) ? teamsResult.payload : { message: "Could not load teams." },
        { status: teamsResult.status || 500 },
      );
    }

    const teams = Array.isArray(teamsResult.payload)
      ? teamsResult.payload
          .map((item) => asTeam(item, userId, viewerEmail))
          .filter((team): team is Omit<DashboardTeam, "documents"> => team !== null)
      : [];

    const withDocuments = await Promise.all(
      teams.map(async (team) => {
        const result = await gatewayJson(`/api/v1/document/list/team/${team.id}`, token);
        const documents = Array.isArray(result.payload)
          ? result.payload.map((item) => asDocument(item, userId, viewerEmail)).filter((doc): doc is TeamDocument => doc !== null)
          : [];
        documents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return { ...team, documents };
      }),
    );

    const teamsByDocument = new Map<string, { id: string; name: string; isPrivate: boolean }[]>();
    for (const team of withDocuments) {
      const ref = { id: team.id, name: team.name, isPrivate: team.isPrivate };
      for (const document of team.documents) {
        const current = teamsByDocument.get(document.id) ?? [];
        if (!current.some((item) => item.id === team.id)) current.push(ref);
        teamsByDocument.set(document.id, current);
      }
    }
    for (const team of withDocuments) {
      for (const document of team.documents) {
        document.sharedTeams = teamsByDocument.get(document.id) ?? [];
      }
    }

    withDocuments.sort(sortTeams);
    return NextResponse.json({ teams: withDocuments });
  } catch {
    return NextResponse.json({ message: "Failed to fetch teams." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const name = isRecord(body) && typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ message: "Team name is required." }, { status: 400 });
    }

    const result = await gatewayJson("/api/v1/team", token, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not create team." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to create team." }, { status: 500 });
  }
}
