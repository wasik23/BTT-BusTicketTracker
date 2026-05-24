import { db } from './db';
import { decrypt, encrypt } from './crypto';

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  const raw = row.isSecret ? decrypt(row.value) : row.value;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown, isSecret = false): Promise<void> {
  const json = JSON.stringify(value);
  const stored = isSecret ? encrypt(json) : json;
  await db.setting.upsert({
    where: { key },
    update: { value: stored, isSecret },
    create: { key, value: stored, isSecret }
  });
}

export async function getSettingsByPrefix(prefix: string): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany({ where: { key: { startsWith: prefix } } });
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    const raw = r.isSecret ? '"***encrypted***"' : r.value;
    try {
      out[r.key] = JSON.parse(raw);
    } catch {
      out[r.key] = null;
    }
  }
  return out;
}

export async function getPaymentConfig() {
  const [bkashEnabled, nagadEnabled, cashEnabled, holdMinutes, serviceFee] = await Promise.all([
    getSetting<boolean>('payment.bkash.enabled', false),
    getSetting<boolean>('payment.nagad.enabled', false),
    getSetting<boolean>('payment.cashOnBoard.enabled', true),
    getSetting<number>('payment.cashOnBoard.holdMinutes', 120),
    getSetting<number>('payment.serviceFeeBdt', 0)
  ]);
  return { bkashEnabled, nagadEnabled, cashEnabled, holdMinutes, serviceFee };
}

export async function getCompanyInfo() {
  const [name, address, ownerName, ownerPhone, supportPhone, complaintPhone, email, about] =
    await Promise.all([
      getSetting<string>('company.name', 'BTT - Bus Ticket Tracker'),
      getSetting<string>('company.address', ''),
      getSetting<string>('company.ownerName', ''),
      getSetting<string>('company.ownerPhone', ''),
      getSetting<string>('company.supportPhone', ''),
      getSetting<string>('company.complaintPhone', ''),
      getSetting<string>('company.email', ''),
      getSetting<string>('company.aboutText', '')
    ]);
  return { name, address, ownerName, ownerPhone, supportPhone, complaintPhone, email, about };
}
