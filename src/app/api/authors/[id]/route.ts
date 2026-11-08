import { InputError, readInput } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type Context = { params: Promise<{ id: string }> };

// GET - Obtener un autor específico por ID.
export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: { orderBy: { publishedYear: "desc" } },
        _count: { select: { books: true } },
      },
    });
    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    }
    return NextResponse.json(author);
  } catch {
    return NextResponse.json({ error: "Error al obtener autor" }, { status: 500 });
  }
}

// PUT - Actualizar un autor.
export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await readInput(request, "author", false);
    const { name, email, bio, nationality, birthYear } = body;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 });
      }
    }
    const author = await prisma.author.update({
      where: { id },
      data: {
        name, email, bio, nationality,
        birthYear: birthYear === undefined ? undefined : birthYear === null || birthYear === "" ? null : parseInt(String(birthYear)),
      },
      include: { books: true },
    });
    return NextResponse.json(author);
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Error al actualizar autor" }, { status: 500 });
  }
}

// DELETE - Eliminar un autor.
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.author.delete({ where: { id } });
    return NextResponse.json({ message: "Autor eliminado correctamente" });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al eliminar autor" }, { status: 500 });
  }
}

