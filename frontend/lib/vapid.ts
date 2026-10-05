let webpushInstance: any = null;

async function getWebPush(): Promise<any> {
  if (webpushInstance) return webpushInstance;
  const mod = await import("web-push");
  webpushInstance = mod.default || mod;
  return webpushInstance;
}

export async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY required");
  const wp = await getWebPush();
  (wp as any).setVapidDetails("mailto:admin@opentip.tech", publicKey, privateKey);
  await (wp as any).sendNotification(
    subscription,
    JSON.stringify(payload),
    { contentEncoding: "aes128gcm" },
  );
}
