"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import CallCalendar from "@/components/ui/CallCalendar";
import Timeline from "./Timeline";
import Memories from "./Memories";
import Chat from "./Chat";
import type { ElderlyProfile } from "@/types";
import type { ElderlyRole } from "@/lib/access/elderlyAccess";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

const TABS: TabItem[] = [
  { id: "historial", label: "Historial" },
  { id: "calendario", label: "Calendario" },
  { id: "recuerdos", label: "Recuerdos" },
  { id: "chatear", label: "Chatear" },
];

export default function ElderlyDetailClient({
  profile,
  role,
}: {
  profile: ElderlyProfile;
  role: ElderlyRole;
}) {
  const [activeTab, setActiveTab] = useState("historial");

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-light text-xl font-semibold text-primary">
              {initials(profile.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary">
                  {profile.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    profile.active
                      ? "bg-secondary-light text-secondary"
                      : "bg-surface-alt text-text-muted"
                  }`}
                >
                  {profile.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              {profile.age && (
                <p className="text-text-secondary">{profile.age} años</p>
              )}
            </div>
          </div>

          {role === "owner" && (
            <Link
              href={`/elderly/${profile.id}/edit`}
              className={`${buttonBaseClasses} ${buttonVariantClasses.ghost} shrink-0 px-4 py-2 text-sm`}
            >
              Editar perfil
            </Link>
          )}
        </div>

        <div className="mt-8">
          <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-8">
          {activeTab === "historial" && <Timeline elderlyId={profile.id} />}
          {activeTab === "calendario" && (
            <CallCalendar elderlyId={profile.id} elderlyName={profile.name} />
          )}
          {activeTab === "recuerdos" && (
            <Memories elderlyId={profile.id} canAdd={role === "owner"} />
          )}
          {activeTab === "chatear" && <Chat elderlyId={profile.id} />}
        </div>
      </div>
    </div>
  );
}
