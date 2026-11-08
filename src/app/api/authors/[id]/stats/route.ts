import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const author = await prisma.author.findUnique({ where: { id }, include: { books: { orderBy: { id: "asc" } } } });
    if (!author) return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    const dated = author.books.filter(book => book.publishedYear !== null).sort((a, b) => a.publishedYear! - b.publishedYear!);
    const paged = author.books.filter(book => book.pages !== null).sort((a, b) => a.pages! - b.pages!);
    const first = dated[0];
    const latest = dated.at(-1);
    const shortest = paged[0];
    const longest = paged.at(-1);
    return NextResponse.json({
      authorId: author.id, authorName: author.name, totalBooks: author.books.length,
      firstBook: first ? { title: first.title, year: first.publishedYear } : null,
      latestBook: latest ? { title: latest.title, year: latest.publishedYear } : null,
      averagePages: paged.length ? Math.round(paged.reduce((sum, book) => sum + book.pages!, 0) / paged.length * 100) / 100 : null,
      genres: [...new Set(author.books.map(book => book.genre).filter((genre): genre is string => !!genre?.trim()))].sort(),
      longestBook: longest ? { title: longest.title, pages: longest.pages } : null,
      shortestBook: shortest ? { title: shortest.title, pages: shortest.pages } : null,
    });
  } catch {
    return NextResponse.json({ error: "No se pudieron obtener las estadísticas del autor" }, { status: 500 });
  }
}
