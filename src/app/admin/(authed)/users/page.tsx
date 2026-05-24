import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentAdmin, type AdminRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function createAdmin(formData: FormData) {
  'use server';
  const me = await getCurrentAdmin();
  if (!me || me.role !== 'SUPER_ADMIN') throw new Error('Only super admin can add users');
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('fullName') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const role = String(formData.get('role') || 'ADMIN') as AdminRole;
  if (!username || password.length < 8) return;
  await db.adminUser.create({
    data: { username, passwordHash: await bcrypt.hash(password, 10), fullName, phone, role }
  });
  revalidatePath('/admin/users');
}

async function toggleActive(id: string) {
  'use server';
  const me = await getCurrentAdmin();
  if (!me || me.role !== 'SUPER_ADMIN') throw new Error('forbidden');
  const u = await db.adminUser.findUnique({ where: { id } });
  if (!u) return;
  await db.adminUser.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath('/admin/users');
}

export default async function AdminUsersPage() {
  const me = await getCurrentAdmin();
  const users = await db.adminUser.findMany({ orderBy: { createdAt: 'desc' } });
  const canManage = me?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Admin users</h1>

      {canManage && (
        <form action={createAdmin} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Add new admin</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field name="username" label="Username" required />
            <Field name="password" label="Password (min 8 chars)" type="password" required />
            <Field name="fullName" label="Full name" />
            <Field name="phone" label="Phone" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select name="role" className="w-full rounded border border-slate-300 px-3 py-2">
              <option value="ADMIN">Admin (everything except adding users)</option>
              <option value="STAFF">Staff (bookings only)</option>
              <option value="SUPER_ADMIN">Super admin (full access)</option>
            </select>
          </div>
          <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Create user</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Last login</th>
              <th className="text-right p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-mono">{u.username}</td>
                <td className="p-3">{u.fullName ?? '—'}<br /><span className="text-xs text-slate-500">{u.phone ?? ''}</span></td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-xs text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB') : 'never'}</td>
                <td className="p-3 text-right">
                  {canManage && u.username !== me?.username ? (
                    <form action={toggleActive.bind(null, u.id)} className="inline">
                      <button className={`text-xs hover:underline ${u.isActive ? 'text-red-600' : 'text-green-700'}`}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </form>
                  ) : (
                    <span className={`text-xs ${u.isActive ? 'text-green-700' : 'text-slate-500'}`}>{u.isActive ? 'Active' : 'Disabled'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ name, label, type = 'text', required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}{required && ' *'}</label>
      <input name={name} type={type} required={required} className="w-full rounded border border-slate-300 px-3 py-2" />
    </div>
  );
}
