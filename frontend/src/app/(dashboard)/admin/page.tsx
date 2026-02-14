"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Spinner } from "@/components/ui";
import { AuditLogTable, AccessRightsMatrix } from "@/components/audit";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetPassword,
  useDeleteUser,
  type AppUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/hooks/use-users";
import {
  useInsuranceCatalog,
  useCreateInsuranceCompany,
  useUpdateInsuranceCompany,
  useDeleteInsuranceCompany,
} from "@/hooks/use-insurance";
import type { InsuranceProviderOption } from "@pdms/shared-types";
import { useAuth } from "@/providers/auth-provider";
import {
  Shield,
  UserPlus,
  Pencil,
  Trash2,
  KeyRound,
  X,
  Check,
  Search,
  Users,
  FileText,
  Lock,
  Building2,
} from "lucide-react";

type Tab = "users" | "audit" | "access" | "insurers";

const ROLE_LABELS: Record<string, string> = {
  arzt: "Arzt",
  pflege: "Pflege",
  fage: "FaGe",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  arzt: "bg-blue-100 text-blue-800",
  pflege: "bg-green-100 text-green-800",
  fage: "bg-amber-100 text-amber-800",
  admin: "bg-purple-100 text-purple-800",
};

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("users");

  // Prüfen ob Admin
  const roles = user?.roles ?? [];
  if (!roles.includes("admin")) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700">Zugriff verweigert</p>
            <p className="text-sm text-slate-500 mt-1">
              Nur Administratoren haben Zugang zum Admin-Bereich.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "users", label: "Benutzer", icon: Users },
    { key: "audit", label: "Audit-Trail", icon: FileText },
    { key: "access", label: "Zugriffsberechtigungen", icon: Lock },
    { key: "insurers", label: "Versicherer", icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-purple-600" />
        <h1 className="text-xl font-bold text-slate-800">Administration</h1>
      </div>

      {/* Tab-Navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Benutzer */}
      {activeTab === "users" && <UserManagement />}

      {/* Tab: Audit-Trail */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle>Zugriffsprotokolle (Audit-Trail)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Protokollierung aller Datenzugriffe und -änderungen gemäss IEC 62304 und nDSG.
            </p>
            <AuditLogTable />
          </CardContent>
        </Card>
      )}

      {/* Tab: Zugriffsberechtigungen */}
      {activeTab === "access" && (
        <Card>
          <CardHeader>
            <CardTitle>Zugriffsberechtigungen (RBAC-Matrix)</CardTitle>
          </CardHeader>
          <CardContent>
            <AccessRightsMatrix />
          </CardContent>
        </Card>
      )}

      {/* Tab: Versicherer-Katalog */}
      {activeTab === "insurers" && <InsuranceCatalogManagement />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Benutzer-Verwaltungs-Komponente
// ═══════════════════════════════════════════════════════════════

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; user: AppUser }
  | { type: "password"; user: AppUser }
  | { type: "delete"; user: AppUser };

function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "closed" });

  const { data: users, isLoading, error } = useUsers({
    search: search || undefined,
    role: roleFilter || undefined,
  });

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner /></div>;
  if (error) return <p className="text-red-600 text-sm">Fehler: {(error as Error).message}</p>;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Suche */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Benutzer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-sm bg-white"
          />
        </div>
        {/* Rollen-Filter */}
        <select
          className="rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Alle Rollen</option>
          <option value="admin">Admin</option>
          <option value="arzt">Arzt</option>
          <option value="pflege">Pflege</option>
          <option value="fage">FaGe</option>
        </select>
        {/* Neuer Benutzer */}
        <Button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Benutzer-Tabelle */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2.5">Benutzer</th>
                <th className="px-4 py-2.5">E-Mail</th>
                <th className="px-4 py-2.5">Rolle</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Letzter Login</th>
                <th className="px-4 py-2.5 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <div>
                        <span className="font-medium text-slate-800">{u.username}</span>
                        {(u.first_name || u.last_name) && (
                          <span className="text-slate-500 ml-1.5">
                            ({[u.first_name, u.last_name].filter(Boolean).join(" ")})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {u.is_active ? (
                        <Badge variant="success">Aktiv</Badge>
                      ) : (
                        <Badge variant="danger">Inaktiv</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleString("de-CH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ type: "edit", user: u })}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ type: "password", user: u })}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
                          title="Passwort zurücksetzen"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", user: u })}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Keine Benutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modale */}
      {modal.type === "create" && (
        <CreateUserModal onClose={() => setModal({ type: "closed" })} />
      )}
      {modal.type === "edit" && (
        <EditUserModal user={modal.user} onClose={() => setModal({ type: "closed" })} />
      )}
      {modal.type === "password" && (
        <PasswordModal user={modal.user} onClose={() => setModal({ type: "closed" })} />
      )}
      {modal.type === "delete" && (
        <DeleteConfirmModal user={modal.user} onClose={() => setModal({ type: "closed" })} />
      )}
    </>
  );
}

function InsuranceCatalogManagement() {
  const { data, isLoading, error } = useInsuranceCatalog();
  const createMut = useCreateInsuranceCompany();
  const updateMut = useUpdateInsuranceCompany();
  const deleteMut = useDeleteInsuranceCompany();

  const [name, setName] = useState("");
  const [supportsBasic, setSupportsBasic] = useState(true);
  const [supportsSemiPrivate, setSupportsSemiPrivate] = useState(true);
  const [supportsPrivate, setSupportsPrivate] = useState(true);

  const addCompany = () => {
    if (!name.trim()) return;
    createMut.mutate(
      {
        name: name.trim(),
        supports_basic: supportsBasic,
        supports_semi_private: supportsSemiPrivate,
        supports_private: supportsPrivate,
      },
      {
        onSuccess: () => {
          setName("");
          setSupportsBasic(true);
          setSupportsSemiPrivate(true);
          setSupportsPrivate(true);
        },
      },
    );
  };

  const patchCompany = (company: InsuranceProviderOption, patch: Partial<InsuranceProviderOption>) => {
    updateMut.mutate({
      id: company.id,
      data: {
        name: patch.name,
        is_active: patch.is_active,
        supports_basic: patch.supports_basic,
        supports_semi_private: patch.supports_semi_private,
        supports_private: patch.supports_private,
      },
    });
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner /></div>;
  if (error) return <p className="text-red-600 text-sm">Fehler: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Versicherer-Katalog</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neuer Versicherer (z. B. Sympany)"
            className="md:col-span-2 rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={supportsBasic} onChange={(e) => setSupportsBasic(e.target.checked)} />
            Grund
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={supportsSemiPrivate} onChange={(e) => setSupportsSemiPrivate(e.target.checked)} />
            Halbprivat
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={supportsPrivate} onChange={(e) => setSupportsPrivate(e.target.checked)} />
            Privat
          </label>
        </div>
        <div className="flex justify-end">
          <Button onClick={addCompany} disabled={createMut.isPending || !name.trim()}>
            {createMut.isPending ? <Spinner /> : "Versicherer hinzufügen"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Logo</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Grund</th>
                <th className="px-3 py-2">Halbprivat</th>
                <th className="px-3 py-2">Privat</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((company) => (
                <tr key={company.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: company.logo_color }}
                      title={company.name}
                    >
                      {company.logo_text}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">{company.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={company.supports_basic}
                      onChange={(e) => patchCompany(company, { supports_basic: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={company.supports_semi_private}
                      onChange={(e) => patchCompany(company, { supports_semi_private: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={company.supports_private}
                      onChange={(e) => patchCompany(company, { supports_private: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => patchCompany(company, { is_active: !company.is_active })}
                      className={`px-2 py-0.5 rounded-full text-xs ${company.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {company.is_active ? "Aktiv" : "Inaktiv"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteMut.mutate(company.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      title="Deaktivieren"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// Modal-Overlay
// ═══════════════════════════════════════════════════════════════

function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Neuer Benutzer erstellen
// ═══════════════════════════════════════════════════════════════

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createMut = useCreateUser();
  const [form, setForm] = useState<UserCreateInput>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "pflege",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form, { onSuccess: onClose });
  };

  return (
    <ModalOverlay title="Neuer Benutzer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vorname" value={form.first_name ?? ""} onChange={(v) => setForm({ ...form, first_name: v })} />
          <FormField label="Nachname" value={form.last_name ?? ""} onChange={(v) => setForm({ ...form, last_name: v })} />
        </div>
        <FormField label="Benutzername *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} required />
        <FormField label="E-Mail *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rolle *</label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="arzt">Arzt</option>
            <option value="pflege">Pflege</option>
            <option value="fage">FaGe</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <FormField
          label="Initiales Passwort *"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          type="password"
          required
          minLength={6}
        />

        {createMut.error && (
          <p className="text-red-600 text-xs">{(createMut.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? <Spinner /> : <><UserPlus className="w-4 h-4 mr-1" /> Erstellen</>}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════
// Benutzer bearbeiten
// ═══════════════════════════════════════════════════════════════

function EditUserModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const updateMut = useUpdateUser();
  const [form, setForm] = useState<UserUpdateInput>({
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    is_active: user.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({ id: user.id, data: form }, { onSuccess: onClose });
  };

  return (
    <ModalOverlay title={`Benutzer bearbeiten: ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vorname" value={form.first_name ?? ""} onChange={(v) => setForm({ ...form, first_name: v })} />
          <FormField label="Nachname" value={form.last_name ?? ""} onChange={(v) => setForm({ ...form, last_name: v })} />
        </div>
        <FormField label="Benutzername" value={form.username ?? ""} onChange={(v) => setForm({ ...form, username: v })} />
        <FormField label="E-Mail" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rolle</label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
            value={form.role ?? user.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="arzt">Arzt</option>
            <option value="pflege">Pflege</option>
            <option value="fage">FaGe</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active ?? true}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="rounded border-slate-300"
          />
          <label htmlFor="is_active" className="text-sm text-slate-600">Benutzer aktiv</label>
        </div>

        {updateMut.error && (
          <p className="text-red-600 text-xs">{(updateMut.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={updateMut.isPending}>
            {updateMut.isPending ? <Spinner /> : <><Check className="w-4 h-4 mr-1" /> Speichern</>}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════
// Passwort zurücksetzen
// ═══════════════════════════════════════════════════════════════

function PasswordModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const resetMut = useResetPassword();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const mismatch = pw !== pw2 && pw2.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || pw.length < 6) return;
    resetMut.mutate({ id: user.id, data: { new_password: pw } }, { onSuccess: onClose });
  };

  return (
    <ModalOverlay title={`Passwort zurücksetzen: ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField
          label="Neues Passwort *"
          value={pw}
          onChange={setPw}
          type="password"
          required
          minLength={6}
        />
        <div>
          <FormField
            label="Passwort bestätigen *"
            value={pw2}
            onChange={setPw2}
            type="password"
            required
            minLength={6}
          />
          {mismatch && (
            <p className="text-red-500 text-xs mt-1">Passwörter stimmen nicht überein.</p>
          )}
        </div>

        {resetMut.error && (
          <p className="text-red-600 text-xs">{(resetMut.error as Error).message}</p>
        )}

        {resetMut.isSuccess && (
          <p className="text-green-600 text-xs">Passwort erfolgreich zurückgesetzt.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={resetMut.isPending || mismatch}>
            {resetMut.isPending ? <Spinner /> : <><KeyRound className="w-4 h-4 mr-1" /> Zurücksetzen</>}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════
// Löschen bestätigen
// ═══════════════════════════════════════════════════════════════

function DeleteConfirmModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const deleteMut = useDeleteUser();

  const handleDelete = () => {
    deleteMut.mutate(user.id, { onSuccess: onClose });
  };

  return (
    <ModalOverlay title="Benutzer löschen" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Möchten Sie den Benutzer <strong>{user.username}</strong>{" "}
          ({[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email})
          wirklich unwiderruflich löschen?
        </p>

        {deleteMut.error && (
          <p className="text-red-600 text-xs">{(deleteMut.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMut.isPending ? <Spinner /> : <><Trash2 className="w-4 h-4 mr-1" /> Löschen</>}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════
// Wiederverwendbares Form-Field
// ═══════════════════════════════════════════════════════════════

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
        required={required}
        minLength={minLength}
      />
    </div>
  );
}
