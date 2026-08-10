import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logAudit, useBanners, type BannerRow } from "@/lib/content";

export const Route = createFileRoute("/control/banners")({
  component: ControlBanners,
});

const YEAR = 60 * 60 * 24 * 365;

function ControlBanners() {
  const { data, isLoading } = useBanners(true);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["banners"] });
  }

  async function create() {
    setBusy(true);
    const next = (data?.length ?? 0) + 1;
    const { data: row, error } = await supabase
      .from("banners")
      .insert({ title: `Banner ${next}`, sort_order: next, active: false })
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit("create", "banner", row.id, { title: row.title });
    toast.success("Banner created");
    refresh();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-black uppercase tracking-widest">Banners</h1>
          <p className="text-xs text-muted-foreground">
            Active banners appear on the player home screen.
          </p>
        </div>
        <button
          onClick={create}
          disabled={busy}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-black uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          <Plus className="size-3.5" /> New
        </button>
      </header>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <p className="rounded-xl border border-border glass-card p-6 text-center text-xs text-muted-foreground">
          No banners yet.
        </p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((b) => (
          <BannerCard key={b.id} banner={b} onChanged={refresh} />
        ))}
      </div>
    </div>
  );
}

function BannerCard({ banner, onChanged }: { banner: BannerRow; onChanged: () => void }) {
  const [form, setForm] = useState({
    title: banner.title,
    subtitle: banner.subtitle,
    button_text: banner.button_text,
    action_url: banner.action_url ?? "",
    image_url: banner.image_url ?? "",
    sort_order: banner.sort_order,
    starts_at: banner.starts_at ? banner.starts_at.slice(0, 16) : "",
    ends_at: banner.ends_at ? banner.ends_at.slice(0, 16) : "",
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function patch(values: Partial<BannerRow>) {
    setBusy(true);
    const { error } = await supabase.from("banners").update(values).eq("id", banner.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await logAudit("update", "banner", banner.id, values as Record<string, unknown>);
    onChanged();
    return true;
  }

  async function save() {
    const ok = await patch({
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      button_text: form.button_text.trim(),
      action_url: form.action_url.trim() || null,
      image_url: form.image_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    });
    if (ok) toast.success("Banner saved");
  }

  async function upload(file: File) {
    setBusy(true);
    const path = `${banner.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (up.error) {
      setBusy(false);
      toast.error(up.error.message);
      return;
    }
    const signed = await supabase.storage.from("banners").createSignedUrl(path, YEAR);
    setBusy(false);
    if (signed.error || !signed.data) {
      toast.error("Upload succeeded but link could not be created");
      return;
    }
    setForm((f) => ({ ...f, image_url: signed.data.signedUrl }));
    await patch({ image_url: signed.data.signedUrl });
    toast.success("Image uploaded");
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("banners").delete().eq("id", banner.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit("delete", "banner", banner.id, {});
    toast.success("Banner deleted");
    onChanged();
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border glass-card p-4">
      {form.image_url && (
        <img
          src={form.image_url}
          alt={form.title}
          loading="lazy"
          className="h-28 w-full rounded-xl object-cover"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => patch({ active: !banner.active })}
          className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase ${
            banner.active ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {banner.active ? <Eye className="mr-1 inline size-3.5" /> : <EyeOff className="mr-1 inline size-3.5" />}
          {banner.active ? "Live" : "Off"}
        </button>
        <button
          onClick={() => patch({ sort_order: banner.sort_order - 1 })}
          aria-label="Move up"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          onClick={() => patch({ sort_order: banner.sort_order + 1 })}
          aria-label="Move down"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
        >
          <ArrowDown className="size-4" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[10px] font-black uppercase text-primary"
        >
          <Upload className="size-3.5" /> Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={remove}
          aria-label="Delete banner"
          className="ml-auto flex size-9 items-center justify-center rounded-lg border border-destructive/40 text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Subtitle" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button text" value={form.button_text} onChange={(v) => setForm({ ...form, button_text: v })} />
        <Field label="Link / action" value={form.action_url} onChange={(v) => setForm({ ...form, action_url: v })} />
        <Field
          label="Image URL"
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
        />
        <Field
          label="Order"
          value={String(form.sort_order)}
          onChange={(v) => setForm({ ...form, sort_order: Number(v) || 0 })}
        />
        <Field label="Show from" type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
        <Field label="Show until" type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-display text-[11px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Save banner
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}
