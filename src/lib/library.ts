export type Book = {
  id: string; title: string; description: string | null; isbn: string;
  publishedYear: number | null; genre: string | null; pages: number | null;
  authorId: string; author?: { id: string; name: string; email: string };
};
export type Author = {
  id: string; name: string; email: string; bio: string | null;
  nationality: string | null; birthYear: number | null; books: Book[];
};
export type AuthorStats = {
  authorId: string; authorName: string; totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number | null; genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
};
export type SearchResult = {
  data: Book[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
};
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...options?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "No se pudo completar la solicitud. Inténtalo nuevamente.");
  return body as T;
}
