export class InputError extends Error {}
type Fields = Record<string, unknown>;
type InputData = { name: string; email: string; title: string; isbn: string; authorId: string; bio?: string | null; nationality?: string | null; description?: string | null; genre?: string | null; birthYear?: string | number | null; publishedYear?: string | number | null; pages?: number | null };
export async function readInput(request: Request, kind: "author" | "book", creating: boolean): Promise<InputData> {
  let raw: unknown;
  try { raw = await request.json(); } catch { throw new InputError("El cuerpo debe ser JSON válido"); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new InputError("Se esperaba un objeto JSON");
  const body = { ...raw } as Fields;
  const required = kind === "author" ? ["name", "email"] : ["title", "isbn", "authorId"];
  const optional = kind === "author" ? ["bio", "nationality"] : ["description", "genre"];
  for (const key of required) {
    if (body[key] === undefined && !creating) continue;
    if (typeof body[key] !== "string" || !body[key].trim()) throw new InputError(`El campo ${key} es requerido y debe ser texto`);
    body[key] = body[key].trim();
  }
  for (const key of optional) {
    if (body[key] !== undefined && body[key] !== null && typeof body[key] !== "string") throw new InputError(`El campo ${key} debe ser texto o null`);
  }
  for (const key of kind === "author" ? ["birthYear"] : ["publishedYear", "pages"]) {
    const value = body[key];
    if (value === "") { body[key] = null; continue; }
    if (value === undefined || value === null) continue;
    if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !/^-?\d+$/.test(value)) || !Number.isInteger(Number(value)) || Number(value) < -2147483648 || Number(value) > 2147483647) throw new InputError(`El campo ${key} debe ser un entero válido`);
    if (key === "pages" && Number(value) < 1) throw new InputError("El número de páginas debe ser mayor a 0");
  }
  if (body.pages !== undefined && body.pages !== null && body.pages !== "") body.pages = Number(body.pages);
  return body as InputData;
}


