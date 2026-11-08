import { InputError, readInput } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type Context = { params: Promise<{ id: string }> };

// GET - Obtener un libro específico por ID.
export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!book) {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
    }
    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Error al obtener libro" }, { status: 500 });
  }
}

// PUT - Actualizar un libro.
export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await readInput(request, "book", false);
    const { title, description, isbn, publishedYear, genre, pages, authorId } = body;
    if (title && title.length < 3) {
      return NextResponse.json({ error: "El título debe tener al menos 3 caracteres" }, { status: 400 });
    }
    if (pages && pages < 1) {
      return NextResponse.json({ error: "El número de páginas debe ser mayor a 0" }, { status: 400 });
    }
    if (authorId) {
      const authorExists = await prisma.author.findUnique({ where: { id: authorId } });
      if (!authorExists) {
        return NextResponse.json({ error: "El autor especificado no existe" }, { status: 404 });
      }
    }
    const book = await prisma.book.update({
      where: { id },
      data: {
        title, description, isbn,
        publishedYear: publishedYear === undefined ? undefined : publishedYear === null || publishedYear === "" ? null : Number(publishedYear),
        genre,
        pages: pages === undefined ? undefined : pages === null ? null : Number(pages),
        authorId,
      },
      include: { author: true },
    });
    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El ISBN ya existe" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Error al actualizar libro" }, { status: 500 });
  }
}

// DELETE - Eliminar un libro.
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ message: "Libro eliminado correctamente" });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al eliminar libro" }, { status: 500 });
  }
}


