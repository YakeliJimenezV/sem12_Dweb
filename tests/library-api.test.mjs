// Pruebas aisladas: Prisma se sustituye por objetos en memoria. No se conecta a Neon.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(relative, prisma = {}) {
  const cache = new Map();
  function moduleAt(file) {
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const compiledModule = { exports: {} };
    cache.set(file, compiledModule.exports);
    const mockedRequire = name => {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name === '@/lib/prisma') return { prisma };
      if (name === '@/generated/prisma/client') return { Prisma: { PrismaClientKnownRequestError: class extends Error {} } };
      if (name.startsWith('@/')) return moduleAt(path.join(root, 'src', name.slice(2) + '.ts'));
      throw new Error(`Import no permitido en prueba aislada: ${name}`);
    };
    vm.runInNewContext(code, { exports: compiledModule.exports, module: compiledModule, require: mockedRequire, Request, Response, URL, console });
    return compiledModule.exports;
  }
  return moduleAt(path.join(root, relative));
}
const request = (body, method = 'PUT') => new Request('http://local/api', { method, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: 'author-1' }) };
test('búsqueda: rechaza parámetros inválidos antes de consultar Prisma', async () => {
  const route = load('src/app/api/books/search/route.ts');
  for (const query of ['page=-1', 'page=1.5', 'limit=0', 'limit=51', 'sortBy=email', 'order=random', 'page=9007199254740991']) {
    assert.equal((await route.GET(new Request(`http://local/api?${query}`))).status, 400);
  }
});
test('búsqueda: combina filtros, orden estable y skip/take reales', async () => {
  let received;
  const prisma = { book: { findMany: args => { received = args; return Promise.resolve([{ id: 'book-1' }]); }, count: () => Promise.resolve(25) }, $transaction: args => Promise.all(args) };
  const route = load('src/app/api/books/search/route.ts', prisma);
  const response = await route.GET(new Request('http://local/api?search=Amor&genre=Novela&authorName=Gabriel&authorId=author-1&page=2&limit=10&sortBy=publishedYear&order=asc'));
  const body = await response.json();
  assert.equal(received.skip, 10); assert.equal(received.take, 10);
  assert.equal(received.where.title.mode, 'insensitive'); assert.equal(received.where.title.contains, 'Amor');
  assert.equal(received.where.author.name.contains, 'Gabriel'); assert.equal(received.where.author.name.mode, 'insensitive');
  assert.equal(received.where.genre, 'Novela'); assert.equal(received.where.authorId, 'author-1');
  assert.equal(received.orderBy[0].publishedYear, 'asc'); assert.equal(received.orderBy[1].id, 'asc');
  assert.deepEqual(body.pagination, { page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true });
});
test('búsqueda: valores predeterminados y colección vacía', async () => {
  let received;
  const prisma = { book: { findMany: args => { received = args; return Promise.resolve([]); }, count: () => Promise.resolve(0) }, $transaction: args => Promise.all(args) };
  const body = await (await load('src/app/api/books/search/route.ts', prisma).GET(new Request('http://local/api'))).json();
  assert.equal(received.take, 10); assert.equal(received.skip, 0); assert.equal(received.orderBy[0].createdAt, 'desc');
  assert.equal(body.pagination.totalPages, 0); assert.equal(body.pagination.hasNext, false); assert.equal(body.pagination.hasPrev, false);
});
test('estadísticas: autor inexistente devuelve 404', async () => {
  const route = load('src/app/api/authors/[id]/stats/route.ts', { author: { findUnique: async () => null } });
  assert.equal((await route.GET(null, context)).status, 404);
});
test('estadísticas: autor sin libros no inventa valores', async () => {
  const route = load('src/app/api/authors/[id]/stats/route.ts', { author: { findUnique: async () => ({ id: 'author-1', name: 'Autor de prueba', books: [] }) } });
  const body = await (await route.GET(null, context)).json();
  assert.equal(body.totalBooks, 0); assert.equal(body.averagePages, null); assert.equal(body.firstBook, null); assert.equal(body.latestBook, null);
  assert.equal(body.longestBook, null); assert.equal(body.shortestBook, null); assert.deepEqual(body.genres, []);
});
test('estadísticas: ignora valores opcionales nulos y elimina géneros duplicados', async () => {
  const books = [{ title: 'Primero', publishedYear: 1950, pages: 100, genre: 'Novela' }, { title: 'Último', publishedYear: 2000, pages: 301, genre: 'Novela' }, { title: 'Sin datos', publishedYear: null, pages: null, genre: null }];
  const route = load('src/app/api/authors/[id]/stats/route.ts', { author: { findUnique: async () => ({ id: 'author-1', name: 'Autor de prueba', books }) } });
  const body = await (await route.GET(null, context)).json();
  assert.equal(body.totalBooks, 3); assert.equal(body.averagePages, 200.5); assert.equal(body.firstBook.year, 1950); assert.equal(body.latestBook.year, 2000);
  assert.equal(body.shortestBook.pages, 100); assert.equal(body.longestBook.pages, 301); assert.deepEqual(body.genres, ['Novela']);
});
test('PUT autor: conserva birthYear omitido y permite borrarlo con null', async () => {
  let data;
  const route = load('src/app/api/authors/[id]/route.ts', { author: { update: async args => { data = args.data; return { id: 'author-1' }; } } });
  assert.equal((await route.PUT(request({ name: 'Nombre actualizado', bio: 'Biografía' }), context)).status, 200);
  assert.equal(data.birthYear, undefined); assert.equal(data.nationality, undefined); assert.equal(data.email, undefined);
  await route.PUT(request({ birthYear: null }), context); assert.equal(data.birthYear, null);
  await route.PUT(request({ birthYear: 1927 }), context); assert.equal(data.birthYear, 1927);
});
test('validación: rechaza JSON inválido, campos vacíos y páginas no positivas', async () => {
  const { readInput } = load('src/lib/api-input.ts');
  await assert.rejects(readInput(new Request('http://local', { method: 'POST', body: '{' }), 'author', true));
  await assert.rejects(readInput(request({ name: ' ', email: 'a@b.com' }), 'author', true));
  await assert.rejects(readInput(request({ title: 'Libro', isbn: 'test', authorId: '1', pages: 0 }), 'book', true));
  await assert.rejects(readInput(request({ birthYear: '1927abc' }), 'author', false));
});


