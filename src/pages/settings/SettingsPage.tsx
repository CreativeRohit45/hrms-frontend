import { useState } from "react";
import ShiftsTab from "./components/ShiftsTab";
import HolidaysTab from "./components/HolidaysTab";
import CompanyTab from "./components/CompanyTab";
import DepartmentsTab from "./components/DepartmentsTab";
import LeaveTypesTab from "./components/LeaveTypesTab";

// ── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "shifts", label: "Shifts", icon: "🕐" },
  { id: "holidays", label: "Holidays", icon: "🎉" },
  { id: "leave-types", label: "Leave Types", icon: "📅" },
  { id: "company", label: "Company", icon: "🏢" },
  { id: "departments", label: "Departments", icon: "👥" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("shifts");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage shifts, holidays, company configuration, and departments
        </p>
      </div>

      {/* Tabs */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabId)}
          className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      <div className="hidden bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit md:flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all
              ${activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        {activeTab === "shifts" && <ShiftsTab />}
        {activeTab === "holidays" && <HolidaysTab />}
        {activeTab === "leave-types" && <LeaveTypesTab />}
        {activeTab === "company" && <CompanyTab />}
        {activeTab === "departments" && <DepartmentsTab />}
      </div>
    </div>
  );
}
