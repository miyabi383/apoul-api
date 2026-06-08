import { labelJobStatus, chipClassForJob } from "@/lib/i18n/ja";

type Props = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusChip({ status, label, className }: Props) {
  const cls = className ?? chipClassForJob(status);
  return (
    <span className={`chip ${cls}`}>
      {label ?? labelJobStatus(status)}
    </span>
  );
}
