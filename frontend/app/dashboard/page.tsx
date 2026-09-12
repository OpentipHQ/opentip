"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";

export default function DashboardProfile() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [pfp, setPfp] = useState<string | null>(null);
  const [header, setHeader] = useState<string | null>(null);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [farcaster, setFarcaster] = useState("");
  const [github, setGithub] = useState("");

  const pfpInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);

  const login = (session?.user as any)?.login as string | undefined;

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/account/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pfp) setPfp(data.pfp);
        if (data.header) setHeader(data.header);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !login) { setLoading(false); return; }
    fetch(`/api/dev/${login}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.pfp) setPfp(data.pfp);
        if (data.header) setHeader(data.header);
        if (data.bio) setBio(data.bio);
        if (data.social?.website) setWebsite(data.social.website);
        if (data.social?.twitter) setTwitter(data.social.twitter);
        if (data.social?.discord) setDiscord(data.social.discord);
        if (data.social?.telegram) setTelegram(data.social.telegram);
        if (data.social?.farcaster) setFarcaster(data.social.farcaster);
        if (data.social?.github) setGithub(data.social.github);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, login]);

  async function uploadFile(file: File, type: "pfp" | "header") {
    const setter = type === "pfp" ? setUploadingPfp : setUploadingHeader;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/upload/${type}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (type === "pfp") setPfp(data.url);
        else setHeader(data.url);
        showToast({ status: "success", title: type === "pfp" ? "Profile picture updated" : "Header updated" });
      } else {
        showToast({ status: "error", title: data.error || "Upload failed" });
      }
    } catch {
      showToast({ status: "error", title: "Upload failed" });
    }
    setter(false);
  }

  function handlePfpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "pfp");
  }

  function handleHeaderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "header");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/dev/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, website, twitter, discord, telegram, farcaster, github }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Profile saved.");
      } else {
        setMessage(data.error || "Failed to save.");
      }
    } catch (e: any) {
      setMessage(e.message || "Failed to save.");
    }
    setSaving(false);
  }

  if (status === "loading" || loading) {
    return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  }

  if (status === "unauthenticated") return null;

  const fallbackName = session?.user?.name || session?.user?.email || "U";

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="serif text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-zinc-600">
          {login
            ? <>Your public profile at <span className="stats text-xs">/dev/{login}</span></>
            : "Link GitHub to get a public profile at /dev/{username}"}
        </p>
      </div>

      <input ref={pfpInput} type="file" accept="image/*" className="hidden" onChange={handlePfpChange} />
      <input ref={headerInput} type="file" accept="image/*" className="hidden" onChange={handleHeaderChange} />

      {/* Header */}
      <section className="space-y-2">
        <div className="border-t rule" />
        <h2 className="text-xs font-medium text-zinc-700">Header</h2>
        <div
          className="relative w-full h-32 rounded-sm overflow-hidden border rule cursor-pointer group"
          onClick={() => headerInput.current?.click()}
        >
          {header ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={header} alt="Header" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-200/50 flex items-center justify-center text-zinc-400 text-xs">
              {uploadingHeader ? "Uploading..." : "Click to upload header image"}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            {uploadingHeader ? (
              <Loader variant="spinner" size={20} />
            ) : (
              <span className="text-xs text-white bg-black/40 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {header ? "Change header" : "Upload header"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Profile picture */}
      <section className="space-y-2">
        <div className="border-t rule" />
        <h2 className="text-xs font-medium text-zinc-700">Profile picture</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => pfpInput.current?.click()}
            className="relative w-20 h-20 rounded-sm overflow-hidden border rule shrink-0 group"
          >
            {pfp ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pfp} alt="PFP" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-200/50 flex items-center justify-center text-zinc-400 text-lg font-semibold">
                {fallbackName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              {uploadingPfp ? (
                <Loader variant="spinner" size={16} />
              ) : (
                <span className="text-xs text-white bg-black/40 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Change
                </span>
              )}
            </div>
          </button>
          <div className="text-xs text-zinc-500">
            <p>Click to upload a new profile picture.</p>
            <p>JPG, PNG, WebP, or GIF. Max 2MB.</p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="space-y-2">
        <div className="border-t rule" />
        <h2 className="text-xs font-medium text-zinc-700">Bio</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell people about yourself..."
          className="w-full bg-transparent border rule rounded-sm px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent resize-none"
        />
      </section>

      {/* Social links */}
      <section className="space-y-3">
        <div className="border-t rule" />
        <h2 className="text-xs font-medium text-zinc-700">Social links</h2>
        <SocialField label="Website" value={website} onChange={setWebsite} placeholder="https://yoursite.com" />
        <SocialField label="GitHub" value={github} onChange={setGithub} placeholder={login || "username"} />
        <SocialField label="Twitter" value={twitter} onChange={setTwitter} placeholder="username" />
        <SocialField label="Discord" value={discord} onChange={setDiscord} placeholder="username" />
        <SocialField label="Telegram" value={telegram} onChange={setTelegram} placeholder="username" />
        <SocialField label="Farcaster" value={farcaster} onChange={setFarcaster} placeholder="username" />
      </section>

      <div className="border-t rule" />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
        {message && <span className="text-xs text-zinc-600">{message}</span>}
      </div>
    </div>
  );
}

function SocialField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-zinc-500 w-20 shrink-0">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
      />
    </div>
  );
}
