import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, MessageCircle, Save, ShieldCheck, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useRefreshWallet } from "@/lib/queries";
import { WHATSAPP_SUPPORT } from "@/lib/constants";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const refresh = useRefreshWallet();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [ffName, setFfName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setFfName(profile.ff_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function save() {
    if (busy) return;
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim().slice(0, 30),
        ff_name: ffName.trim().slice(0, 30),
        phone: phone.trim().slice(0, 15),
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-wide">My Profile</h1>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full gradient-vortex">
            <UserRound className="size-7 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-black uppercase">{profile?.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <LabeledInput label="Username" value={username} onChange={setUsername} max={30} />
          <LabeledInput label="In-game name" value={ffName} onChange={setFfName} max={30} />
          <LabeledInput label="Mobile number" value={phone} onChange={setPhone} max={15} />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          <Save className="size-4" /> Save Changes
        </button>
      </div>

      <a
        href={WHATSAPP_SUPPORT}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-card p-4"
      >
        <MessageCircle className="size-5 text-accent" />
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest">24/7 Support</p>
          <p className="text-sm text-muted-foreground">Chat with us on WhatsApp</p>
        </div>
      </a>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
          <ShieldCheck className="size-4" /> Fair play &amp; terms
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 18+ only. Skill-based gaming. Play responsibly.</li>
          <li>• Hacking, teaming or unregistered players cause a permanent ban.</li>
          <li>• Entry fees are non-refundable if you miss a match.</li>
          <li>• Withdrawals are processed to UPI, usually within minutes.</li>
          <li>• We reserve the right to modify prizes, timings and rules.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate({ to: "/auth", replace: true });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-3 font-display text-xs font-bold uppercase tracking-widest text-destructive"
      >
        <LogOut className="size-4" /> Logout
      </button>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none"
      />
    </label>
  );
}
