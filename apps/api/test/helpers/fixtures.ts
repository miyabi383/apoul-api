// test/helpers/fixtures.ts

export const approvedEvent = (overrides: Partial<{
  contractId: string;
  customerId: string;
  amount: number;
  idempotencyKey: string;
}> = {}) => ({
  eventType: "contract.approved",
  sourceSystem: "contract",
  resourceType: "contract",
  resourceId: overrides.contractId ?? "C-1001",
  occurredAt: "2026-06-08T00:55:00+09:00",
  idempotencyKey: overrides.idempotencyKey ?? "contract-C-1001-approved-v1",
  payload: {
    contractId: overrides.contractId ?? "C-1001",
    customerId: overrides.customerId ?? "CUST-22",
    amount: overrides.amount ?? 120000,
    currency: "JPY",
    approvedBy: "u-7",
    approvedAt: "2026-06-08T00:55:00+09:00",
  },
});
