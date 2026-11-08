import { InputError, readInput } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// GET - Obtener todos los autores.
export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      include: { books: true, _count: { select: { books: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(authors);
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.log(error);
    return NextResponse.json({ error: "Error al obtener autores" }, { status: 500 });
  }
}

// POST - Crear un nuevo autor.
export async function POST(request: Request) {
  try {
    const body = await readInput(request, "author", true);
    const { name, email, bio, nationality, birthYear } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const author = await prisma.author.create({
      data: {
        name, email, bio, nationality,
        birthYear: birthYear ? parseInt(String(birthYear)) : null,
      },
      include: { books: true },
    });
    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    console.log(error);
    return NextResponse.json({ error: "Error al crear autor" }, { status: 500 });
  }
}

