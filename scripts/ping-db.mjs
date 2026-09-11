#!/usr/bin/env node
// Ping DATABASE_URL — works for Azure Postgres Flexible Server (sslmode=require)
// Usage: node scripts/ping-db.mjs            (reads DATABASE_URL from .env or indexer/.env or frontend/.env)
//        DATABASE_URL="postgres://..." node scripts/ping-db.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const k = m[1], v = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(path.join(__dirname, "../indexer/.env"));
loadEnvFile(path.join(__dirname, "../frontend/.env"));
loadEnvFile(path.join(__dirname, "../.env"));
loadEnvFile(path.join(__dirname, "../contracts/.env"));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set (checked indexer/.env, frontend/.env, .env, contracts/.env)");
  process.exit(1);
}

console.log("DATABASE_URL:", url.replace(/:[^:@/]+@/, ":****@")); // mask password

// Try Prisma if available, else raw pg
let used = "";
try {
  const { PrismaClient } = await import("@prisma/client");
  used = "prisma";
  const prisma = new PrismaClient();
  await prisma.$connect();
  const r = await prisma.$queryRaw`SELECT 1 as ping, now() as now, version() as version`;
  console.log("✅ Prisma connected:", r);
  // try listing tables
  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  console.log("Tables:", tables);
  await prisma.$disconnect();
} catch (e) {
  console.error(`Prisma ping failed (${used||"prisma"}):`, e.message);
  // fallback to pg
  try {
    const pg = await import("pg");
    used = "pg";
    const client = new pg.Client({ connectionString: url, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
    await client.connect();
    const r = await client.query("SELECT 1 as ping, now() as now, version() as version");
    console.log("✅ pg connected:", r.rows[0]);
    const t = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    console.log("Tables:", t.rows);
    await client.end();
  } catch (e2) {
    console.error("pg fallback failed:", e2.message);
    console.error("\nHints for Azure Flexible Server:");
    console.error("- Ensure DATABASE_URL includes ?sslmode=require");
    console.error("- Check firewall: Azure Portal → Postgres → Networking → Allow public access + add your IP or 0.0.0.0-255.255.255.255 for test");
    console.error("- Check user/pass and db name: postgresql://user:pass@<server>.postgres.database.azure.com:5432/opentip?sslmode=require");
    console.error("- Try: npx prisma db pull   or   psql \"$DATABASE_URL\" -c 'select 1'");
    process.exit(1);
  }
}
