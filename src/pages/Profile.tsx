import React, { useState, useEffect } from "react";
import { BriefcaseBusiness, Mail, Phone, UserCircle2 } from "lucide-react";
import { useMyProfile, useUpdateMyProfile, useChangePassword } from "../hooks/queries/useEmployees";
import { useMyBalances } from "../hooks/queries/useLeaves";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { useAppToast } from "../components/ui/ToastProvider";

export default function Profile() {
  const { pushToast } = useAppToast();
  
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useMyProfile();
  const { data: balances = [] } = useMyBalances();
  const updateMutation = useUpdateMyProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    email: "",
    photoUrl: "",
  });

  // Sync form state when profile data successfully loads
  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || "",
        email: profile.email || "",
        photoUrl: profile.photoUrl || "",
      });
    }
  }, [profile]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(form);
      setIsEditing(false);
      pushToast({ tone: "success", title: "Profile updated", message: "Your personal information has been saved." });
    } catch {
      pushToast({ tone: "error", title: "Update failed", message: "We could not save your profile changes." });
    }
  }

  if (isProfileLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading profile data...</div>;
  }

  if (isProfileError || !profile) {
    return <ErrorState message="We could not load your profile details." />;
  }

  const totalAllocated = balances.reduce((sum, balance) => sum + balance.allocated, 0);
  const totalRemaining = balances.reduce((sum, balance) => sum + balance.balance, 0);
  const displayClass = "rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-800 dark:bg-gray-950/40 dark:text-white";
  const inputClass = "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Keep your personal details accurate and review your employment snapshot in one place."
        actions={!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700">
            Edit personal info
          </button>
        ) : undefined}
      />



      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-indigo-100 bg-gray-100 dark:border-indigo-900/30 dark:bg-gray-800">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-14 w-14 text-indigo-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h2>
            <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">{profile.designation}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">{profile.employeeCode}</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Employment Summary</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-indigo-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.departmentName}</p>
                  <p className="text-gray-500 dark:text-gray-400">Joined {profile.dateOfJoining}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-indigo-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.phone || "No phone number"}</p>
                  <p className="text-gray-500 dark:text-gray-400">Primary contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-indigo-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.email || "No email"}</p>
                  <p className="text-gray-500 dark:text-gray-400">Work email</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={handleUpdate} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Personal Information</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Phone Number</label>
                {isEditing ? <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /> : <div className={displayClass}>{profile.phone || "Not provided"}</div>}
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                {isEditing ? <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /> : <div className={displayClass}>{profile.email || "Not provided"}</div>}
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <div className={displayClass}>{profile.dateOfBirth || "Not provided"}</div>
              </div>
              <div>
                <label className={labelClass}>Profile Photo URL</label>
                {isEditing ? <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className={inputClass} placeholder="https://example.com/photo.jpg" /> : <div className={displayClass}>{profile.photoUrl || "Not provided"}</div>}
              </div>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Salary and Leave Snapshot</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Base Salary</label>
                <div className={displayClass}>Rs. {profile.baseSalary?.toLocaleString() || "0"}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>HRA</label>
                  <div className={displayClass}>{profile.hraPercentage}%</div>
                </div>
                <div>
                  <label className={labelClass}>PF</label>
                  <div className={displayClass}>{profile.pfPercentage}%</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-950/30">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Leave balances</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().getFullYear()} summary</p>
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalRemaining} / {totalAllocated} remaining</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {balances.map((balance) => (
                  <div key={balance.leaveTypeCode} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{balance.leaveTypeCode}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{balance.balance}/{balance.allocated}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{balance.leaveTypeName}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {isEditing && (
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    phone: profile.phone || "",
                    email: profile.email || "",
                    photoUrl: profile.photoUrl || "",
                  });
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-60">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        <ChangePasswordSection />
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const { pushToast } = useAppToast();
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      pushToast({ tone: "error", title: "Validation error", message: "New passwords do not match" });
      return;
    }
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      pushToast({ tone: "success", title: "Success", message: "Password updated successfully" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      pushToast({ tone: "error", title: "Error", message: "Could not change password. Please check your current password." });
    }
  }

  const inputClass = "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="col-span-full space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Security</p>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Current Password</label>
            <input type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input type="password" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputClass} />
          </div>
        </div>
      </section>
      <div className="flex justify-end border-t border-gray-100 pt-6 dark:border-gray-800">
        <button type="submit" disabled={isPending || !form.currentPassword || !form.newPassword} className="rounded-2xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-black disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          {isPending ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
