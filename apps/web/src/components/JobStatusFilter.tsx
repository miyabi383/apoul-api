"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JOB_STATUSES, ja, labelJobStatus } from "@/lib/i18n/ja";

export function JobStatusFilter({ current }: { current?: string }) {
  const pathname = usePathname();

  return (
    <div className="filter-bar" role="group" aria-label={ja.jobs.filter}>
      {JOB_STATUSES.map((s) => {
        const active = (current ?? "") === s;
        const href = s ? `${pathname}?status=${s}` : pathname;
        const label = s ? labelJobStatus(s) : ja.common.all;
        return (
          <Link
            key={s || "all"}
            href={href}
            className={active ? "filter-pill active" : "filter-pill"}
            aria-current={active ? "true" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
