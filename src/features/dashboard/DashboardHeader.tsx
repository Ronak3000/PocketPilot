"use client";

import React, { useEffect, useState } from "react";
import { pocketPilotClient } from "@/mocks/adapter";

export default function DashboardHeader() {
  const [userName, setUserName] = useState<string>("Arjun");

  useEffect(() => {
    pocketPilotClient.getProfile().then((profile) => {
      if (profile?.name) setUserName(profile.name);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8 animate-fade-in">
      {/* Left Greeting */}
      <div>
        <h1 className="text-[32px] font-bold text-[var(--color-text-primary)] tracking-tight leading-tight flex items-center gap-2">
          Hey {userName},
          <span className="text-[#f59e0b] text-[24px]">✨</span>
        </h1>
        <h2 className="text-[32px] font-bold text-[var(--color-text-primary)] tracking-tight leading-tight mb-2">
          what are we planning today?
        </h2>
        <p className="text-[15px] text-[var(--color-text-secondary)] font-medium">
          Smart plans. Better choices. More freedom.
        </p>
      </div>
    </div>
  );
}
