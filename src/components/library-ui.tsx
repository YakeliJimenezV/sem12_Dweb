"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api, type Author, type Book } from "@/lib/library";
import { Icon, type IconName } from "./icon";

export function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return message ? <div className={`notice ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{message}</div> : null;
}
export function Loading() { return <div className="empty" role="status"><span className="spinner"/>Cargando biblioteca…</div>; }
export function Stat({ icon, value, label }: { icon: IconName; value: ReactNode; label: string }) {
  return <div className="stat"><span className="stat-icon"><Icon name={icon} size={29}/></span><div><strong>{value}</strong><span>{label}</span></div></div>;
}
// Fotografías decorativas locales; el degradado se aplica sin oscurecer los controles.
export function LibraryBackdrop() {
  return (
    <div className="library-photograph" aria-hidden="true">
      <Image
        src="/images/biblioteca-header.jpg"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 900px) 55vw, 600px"
        preload
      />
    </div>
  );
}
export function Hero({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <header className="hero">
      <LibraryBackdrop />
      <div className="hero-copy">
        <span className="eyebrow">TU COLECCIÓN, TU HISTORIA</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="hero-action">{children}</div>
    </header>
  );
}
export function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}><div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" onClick={close} aria-label="Cerrar"><Icon name="close"/></button></div>{children}</dialog>;
}
export function AuthorForm({ author, saved, cancel }: { author?: Author; saved: () => void; cancel?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    setBusy(true); setError("");
    try {
      await api(author ? `/api/authors/${author.id}` : "/api/authors", { method: author ? "PUT" : "POST", body: JSON.stringify({
        name: String(fields.get("name")).trim(), email: String(fields.get("email")).trim(),
        bio: String(fields.get("bio")).trim() || null, nationality: String(fields.get("nationality")).trim() || null,
        birthYear: fields.get("birthYear") ? Number(fields.get("birthYear")) : null,
      }) });
      saved();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el autor"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="editor"><Notice message={error} error/><label>Nombre completo<input name="name" required defaultValue={author?.name} maxLength={200}/></label><label>Correo electrónico<input name="email" type="email" required defaultValue={author?.email}/></label><div className="form-grid"><label>Nacionalidad<input name="nationality" defaultValue={author?.nationality ?? ""}/></label><label>Año de nacimiento<input name="birthYear" type="number" step="1" min="-9999" max={new Date().getFullYear()} defaultValue={author?.birthYear ?? ""}/></label></div><label>Biografía<textarea name="bio" rows={4} defaultValue={author?.bio ?? ""}/></label><div className="form-actions"><button className="button gold" disabled={busy}>{busy ? "Guardando…" : author ? "Guardar cambios" : "Crear autor"}</button>{cancel && <button type="button" className="button outline" onClick={cancel} disabled={busy}>Cancelar</button>}</div></form>;
}
export function BookForm({ book, authors, authorId, saved, cancel }: { book?: Book; authors: Author[]; authorId?: string; saved: () => void; cancel: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const body = { title: String(fields.get("title")).trim(), isbn: String(fields.get("isbn")).trim(),
        description: String(fields.get("description")).trim() || null,
        genre: String(fields.get("genre")).trim() || null,
        publishedYear: fields.get("publishedYear") ? Number(fields.get("publishedYear")) : null,
        pages: fields.get("pages") ? Number(fields.get("pages")) : null,
        authorId: String(fields.get("authorId")),
      };
      if (body.title.length < 3) throw new Error("El título debe tener al menos 3 caracteres");
      await api(book ? `/api/books/${book.id}` : "/api/books", { method: book ? "PUT" : "POST", body: JSON.stringify(body) }); saved();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el libro"); } finally { setBusy(false); }
  }
  return <form className="editor" onSubmit={submit}><Notice message={error} error/><label>Título<input name="title" required minLength={3} defaultValue={book?.title}/></label><div className="form-grid"><label>ISBN<input name="isbn" required defaultValue={book?.isbn}/></label><label>Autor<select name="authorId" required defaultValue={book?.authorId ?? authorId ?? ""}><option value="" disabled>Seleccionar autor</option>{authors.map(author => <option value={author.id} key={author.id}>{author.name} · {author.email}</option>)}</select></label></div><div className="form-grid"><label>Género<input name="genre" defaultValue={book?.genre ?? ""}/></label><label>Año de publicación<input name="publishedYear" type="number" step="1" min="-9999" max="9999" defaultValue={book?.publishedYear ?? ""}/></label></div><label>Número de páginas<input name="pages" type="number" min="1" step="1" defaultValue={book?.pages ?? ""}/></label><label>Descripción<textarea name="description" rows={3} defaultValue={book?.description ?? ""}/></label><div className="form-actions"><button className="button gold" disabled={busy || !authors.length}>{busy ? "Guardando…" : book ? "Guardar cambios" : "Crear libro"}</button><button className="button outline" type="button" disabled={busy} onClick={cancel}>Cancelar</button></div>{!authors.length && <p className="muted">Primero registra un autor en Inicio.</p>}</form>;
}
export function DeleteDialog({ title, description, url, deleted, close }: { title: string; description: string; url: string; deleted: () => void; close: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() { setBusy(true); try { await api(url, { method: "DELETE" }); deleted(); } catch (err) { setError(err instanceof Error ? err.message : "No se pudo eliminar"); } finally { setBusy(false); } }
  return <Modal title={title} close={() => { if (!busy) close(); }}><p>{description}</p><Notice message={error} error/><div className="form-actions"><button className="button danger" onClick={remove} disabled={busy}>{busy ? "Eliminando…" : "Sí, eliminar"}</button><button className="button outline" onClick={close} disabled={busy}>Cancelar</button></div></Modal>;
}
export function BookCover({ book }: { book: Book }) {
  const variant = [...book.title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <div className={`book-cover cover-${variant}`} aria-label={`Portada tipográfica de ${book.title}`}><span>BIBLIOTECA DIGITAL</span><i>✦</i><strong>{book.title}</strong><small>{book.author?.name ?? "Colección de autor"}</small><i>❧</i></div>;
}
export function BookActions({ edit, remove }: { edit: () => void; remove: () => void }) {
  return <div className="actions"><button className="icon-button gold" onClick={edit} aria-label="Editar libro" title="Editar libro"><Icon name="edit" size={17}/></button><button className="icon-button danger" onClick={remove} aria-label="Eliminar libro" title="Eliminar libro"><Icon name="trash" size={17}/></button></div>;
}


