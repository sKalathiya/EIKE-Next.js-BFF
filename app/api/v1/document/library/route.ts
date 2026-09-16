import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;
const PRIVATE_TEAM_NAME = "Private";

type TeamRef = { id: string; name: string };

type LibraryDocument = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  teams: TeamRef[];
  lastSharedWith: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asDateString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function asTeam(value: unknown): TeamRef | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const name = value.name;
  if (typeof id !== "string" || !id || typeof name !== "string" || !name) return null;
  return { id, name };
}

function asDocument(value: unknown): Omit<LibraryDocument, "teams" | "lastSharedWith" | "isMine"> | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const fileName = value.fileName;
  const status = value.status;
  if (typeof id !== "string" || !id || typeof fileName !== "string" || typeof status !== "string") {
    return null;
  }
  const createdAt = asDateString(value.createdAt) ?? asDateString(value.updatedAt) ?? new Date(0).toISOString();
  const updatedAt = asDateString(value.updatedAt) ?? createdAt;
  return { id, fileName, status, createdAt, updatedAt };
}

function asDocumentList(payload: unknown) {
  if (!Array.isArray(payload)) return [];
  return payload.map(asDocument).filter((doc): doc is NonNullable<typeof doc> => doc !== null);
}

async function gatewayJson(path: string, token: string) {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const [mineResult, teamsResult] = await Promise.all([
      gatewayJson("/api/v1/document/list/me", token),
      gatewayJson("/api/v1/team/user", token),
    ]);

    if (mineResult.status === 401 || teamsResult.status === 401) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const teams = Array.isArray(teamsResult.payload)
      ? teamsResult.payload.map(asTeam).filter((team): team is TeamRef => team !== null)
      : [];
    teams.sort((a, b) => {
      if (a.name === PRIVATE_TEAM_NAME) return -1;
      if (b.name === PRIVATE_TEAM_NAME) return 1;
      return a.name.localeCompare(b.name);
    });
    const privateTeam = teams.find((team) => team.name === PRIVATE_TEAM_NAME) ?? teams[0] ?? null;

    const teamDocEntries = await Promise.all(
      teams.map(async (team) => {
        const result = await gatewayJson(`/api/v1/document/list/team/${team.id}`, token);
        return { team, documents: result.ok ? asDocumentList(result.payload) : [] };
      }),
    );

    const documentsById = new Map<string, Omit<LibraryDocument, "teams" | "lastSharedWith" | "isMine">>();
    const teamsByDocument = new Map<string, TeamRef[]>();

    const mineDocuments = asDocumentList(mineResult.ok ? mineResult.payload : []);
    const mineIds = new Set(mineDocuments.map((document) => document.id));

    for (const document of mineDocuments) {
      documentsById.set(document.id, document);
    }

    for (const { team, documents } of teamDocEntries) {
      for (const document of documents) {
        documentsById.set(document.id, document);
        const current = teamsByDocument.get(document.id) ?? [];
        if (!current.some((item) => item.id === team.id)) current.push(team);
        teamsByDocument.set(document.id, current);
      }
    }

    if (documentsById.size === 0 && !mineResult.ok && !teamsResult.ok) {
      return NextResponse.json(
        isRecord(mineResult.payload) ? mineResult.payload : { message: "Could not load documents." },
        { status: mineResult.status || 500 },
      );
    }

    const documents: LibraryDocument[] = [...documentsById.values()]
      .map((document) => {
        const docTeams = teamsByDocument.get(document.id) ?? [];
        const sharedTeams = docTeams.filter((team) => team.name !== PRIVATE_TEAM_NAME);
        return {
          ...document,
          isMine: mineIds.has(document.id),
          teams: docTeams,
          lastSharedWith: sharedTeams.at(-1)?.name ?? (docTeams[0]?.name === PRIVATE_TEAM_NAME ? "Not shared" : docTeams[0]?.name ?? "Not shared"),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      documents,
      teams,
      privateTeamId: privateTeam?.id ?? null,
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch documents." }, { status: 500 });
  }
}
