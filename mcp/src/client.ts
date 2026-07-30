import "dotenv/config";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const BASE_URL = (process.env.MEMORA_API_URL ?? "http://localhost:3000/api").replace(/\/+$/, "");

let token: string | null = process.env.MEMORA_API_TOKEN ?? null;

export function setToken(nuevoToken: string | null): void {
  token = nuevoToken;
}

export function getToken(): string | null {
  return token;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
}

export class MemoraApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "MemoraApiError";
  }
}

async function request(method: string, path: string, options: RequestOptions = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};
  if (options.auth) {
    if (!token) {
      throw new Error(
        "No hay sesión activa. Usa la herramienta 'auth_login' (o 'auth_set_token' si ya tienes un token) antes de llamar a esta herramienta.",
      );
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;
  if (options.form) {
    requestBody = options.form;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(options.body);
  }

  const res = await fetch(url, { method, headers, body: requestBody });
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    throw new MemoraApiError(res.status, message);
  }

  return data;
}

export const api = {
  get: (path: string, query?: Query, auth = false) => request("GET", path, { query, auth }),
  post: (path: string, body?: unknown, auth = false) => request("POST", path, { body, auth }),
  patch: (path: string, body?: unknown, auth = false) => request("PATCH", path, { body, auth }),
  put: (path: string, body?: unknown, auth = false) => request("PUT", path, { body, auth }),
  delete: (path: string, auth = false) => request("DELETE", path, { auth }),
  postForm: (path: string, form: FormData, auth = false) => request("POST", path, { form, auth }),
  patchForm: (path: string, form: FormData, auth = false) => request("PATCH", path, { form, auth }),
};

/** Adjunta archivos locales (por ruta absoluta) a un FormData, bajo el campo dado. */
export async function adjuntarArchivos(form: FormData, campo: string, rutas: string[] | undefined): Promise<void> {
  if (!rutas || rutas.length === 0) return;
  for (const ruta of rutas) {
    const buffer = await readFile(ruta);
    form.append(campo, new Blob([buffer]), basename(ruta));
  }
}
