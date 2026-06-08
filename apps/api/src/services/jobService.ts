// Job 作成後の enqueue 抽象 — Phase 3: Worker が pending Job を pickup

/** イベント受信後に作成された Job。Worker が非同期処理する。 */
export async function onJobsCreated(_jobIds: bigint[]): Promise<void> {
  // DB 上は pending。将来 BullMQ / pg-boss 差し替えポイント。
}
