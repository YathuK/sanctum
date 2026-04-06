"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [plan, setPlan] = useState("developer");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.company) setCompany(data.company);
          if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
          if (data.emailNotifications !== undefined) setEmailNotifications(data.emailNotifications);
          if (data.plan) setPlan(data.plan);
        })
        .catch(() => {});
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, webhookUrl, emailNotifications }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-app.com/webhooks/sanctum"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Receive real-time transaction events via webhook</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Email Notifications</p>
                <p className="text-xs text-slate-400">Receive email alerts for escalations and blocked transactions</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? "bg-indigo-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing Plan</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                plan === "enterprise" ? "bg-indigo-100 text-indigo-700" :
                plan === "team" ? "bg-green-100 text-green-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
              <span className="text-sm text-slate-500">Current plan</span>
            </div>
            <p className="text-sm text-slate-500">
              {plan === "developer" && "Free plan with up to 3 agents and 100 transactions/day."}
              {plan === "team" && "Team plan with up to 25 agents and 5,000 transactions/day."}
              {plan === "enterprise" && "Enterprise plan with unlimited agents and transactions."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
