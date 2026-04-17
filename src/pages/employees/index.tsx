import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import EmployeeList from "./EmployeeList";
import EmployeeCreate from "./EmployeeCreate";
import EmployeeEdit from "./EmployeeEdit";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAppToast } from "../../components/ui/ToastProvider";

type View = "list" | "create" | "edit";

export default function EmployeesPage() {
  const { pushToast } = useAppToast();
  const [view, setView] = useState<View>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!successBanner) return;
    const timer = window.setTimeout(() => setSuccessBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [successBanner]);

  function handleAddEmployee() {
    setSuccessBanner(null);
    setView("create");
  }

  function handleEditEmployee(id: number) {
    setSuccessBanner(null);
    setEditingId(id);
    setView("edit");
  }

  function handleCreateSuccess(employeeCode: string) {
    setView("list");
    setRefreshKey((key) => key + 1);
    setSuccessBanner(`Employee ${employeeCode} created successfully.`);
    pushToast({ tone: "success", title: "Employee created", message: `${employeeCode} is now available in People.` });
  }

  function handleEditSuccess(employeeCode: string) {
    setView("list");
    setEditingId(null);
    setRefreshKey((key) => key + 1);
    setSuccessBanner(`Employee ${employeeCode} updated successfully.`);
    pushToast({ tone: "success", title: "Employee updated", message: `${employeeCode} was updated successfully.` });
  }

  return (
    <div className="space-y-6">
      {view === "list" && (
        <PageHeader
          title="People"
          subtitle="Manage employee records, reporting structure, and profile details from one consistent workspace."
        />
      )}

      {successBanner && view === "list" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-white p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Success</p>
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{successBanner}</p>
              <p className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80">Credentials should be shared through your secure onboarding process, not inside the list UI.</p>
            </div>
          </div>
        </div>
      )}

      {view === "list" && <EmployeeList onAddEmployee={handleAddEmployee} onEditEmployee={handleEditEmployee} refreshKey={refreshKey} />}
      {view === "create" && <EmployeeCreate onSuccess={handleCreateSuccess} onCancel={() => setView("list")} />}
      {view === "edit" && editingId && <EmployeeEdit employeeId={editingId} onSuccess={handleEditSuccess} onCancel={() => setView("list")} />}
    </div>
  );
}
