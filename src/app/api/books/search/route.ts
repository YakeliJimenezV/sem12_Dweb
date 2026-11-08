import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const page = Number(query.get("page") ?? 1);
  const limit = Number(query.get("limit") ?? 10);
  const sortBy = query.get("sortBy") ?? "createdAt";
  const order = query.get("order") ?? "desc";
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 ||
      !Number.isSafeInteger((page - 1) * limit) ||
      !["title", "publishedYear", "createdAt"].includes(sortBy) || !["asc", "desc"].includes(order)) {
    return NextResponse.json({ error: "Parámetros inválidos: page debe ser positivo, limit de 1 a 50, sortBy title/publishedYear/createdAt y order asc/desc" }, { status: 400 });
  }
  const search = query.get("search")?.trim();
  const genre = query.get("genre");
  const authorName = query.get("authorName")?.trim();
  // El filtro exacto por ID permite distinguir autores con el mismo nombre en el catálogo.
  const authorId = query.get("authorId");
  const where: Prisma.BookWhereInput = {
    ...(search && { title: { contains: search, mode: "insensitive" } }),
    ...(genre && { genre }),
    ...(authorName && { author: { name: { contains: authorName, mode: "insensitive" } } }),
    ...(authorId && { authorId }),
  };
  try {
    const [data, total] = await prisma.$transaction([
      prisma.book.findMany({ where, include: { author: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * limit, take: limit,
        orderBy: [{ [sortBy]: order }, { id: "asc" }],
      }),
      prisma.book.count({ where }),
    ], { isolationLevel: "RepeatableRead" });
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({ data, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el catálogo" }, { status: 500 });
  }
}
