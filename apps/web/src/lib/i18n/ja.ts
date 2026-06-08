export const ja = {
  app: {
    name: "APOUL",
    subtitle: "イベント連携ハブ",
    admin: "管理コンソール",
  },
  nav: {
    map: "全体マップ",
    flows: "フロー",
    jobs: "ジョブ",
    systems: "システム",
    clients: "APIクライアント",
    progress: "進捗管理",
  },
  theme: {
    light: "ライト",
    dark: "ダーク",
    toggle: "テーマ切替",
  },
  common: {
    cancel: "キャンセル",
    register: "登録",
    issue: "発行",
    revoke: "失効",
    copy: "コピー",
    close: "閉じる",
    back: "一覧に戻る",
    all: "すべて",
    loading: "処理中…",
    fetchError: "データの取得に失敗しました",
    networkError: "通信エラーが発生しました",
    noData: "表示するデータがありません",
    adminRequired: "この操作には管理者権限が必要です",
    authDisabled: "開発モード（認証無効）",
    logout: "ログアウト",
    none: "—",
    confirm: "確認",
  },
  jobs: {
    title: "ジョブ一覧",
    desc: "イベント受信から配送までの処理状況を確認・操作します",
    filter: "状態で絞り込み",
    id: "ジョブID",
    event: "イベント種別",
    source: "送信元",
    status: "状態",
    destKey: "配送キー",
    attempts: "試行回数",
    updated: "更新日時",
    detail: "ジョブ詳細",
    payload: "受信ペイロード",
    transformed: "変換後データ",
    attemptHistory: "試行履歴",
    retry: "手動再送",
    dead: "Dead化",
    destKeyLabel: "配送キー",
    errorLabel: "エラー",
    http: "HTTP",
    attemptNo: "回数",
    time: "日時",
    empty: "ジョブがまだありません",
    retryHint: "失敗・リトライ中のジョブを再処理できます",
  },
  systems: {
    title: "システム",
    desc: "連携先・送信元システムの登録と有効/停止を管理します",
    add: "システムを登録",
    code: "コード",
    codeHint: "変更不可（英小文字・数字・アンダースコア）",
    name: "名称",
    baseUrl: "ベースURL",
    baseUrlOptional: "任意",
    status: "状態",
    clients: "クライアント数",
    actions: "操作",
    enable: "有効化",
    disable: "停止",
    disableConfirm: "このシステムへの連携を停止します。よろしいですか？",
    empty: "登録されているシステムがありません",
    placeholders: { code: "billing", name: "請求システム", baseUrl: "https://billing.example.com" },
  },
  clients: {
    title: "APIクライアント",
    desc: "APIキーの発行・失効とスコープを管理します",
    add: "クライアントを発行",
    name: "クライアント名",
    system: "所属システム",
    scopes: "スコープ",
    status: "状態",
    keys: "キー情報",
    actions: "操作",
    issuedTitle: "APIキーを発行しました",
    issuedWarn: "このキーは再表示されません。安全な場所に保管してください。",
    revokeConfirm: "このクライアントと配下のキーを失効します。よろしいですか？",
    revokeReason: "失効理由（任意）",
    keyRevoked: "失効済み",
    keyUnused: "未使用",
    empty: "発行済みクライアントがありません",
    placeholder: "billing-prod",
  },
  progress: {
    title: "進捗管理",
    desc: "プロジェクトのWBS進捗を一覧表示します",
    wbs: "WBS",
    task: "タスク",
    status: "状態",
    percent: "進捗",
    note: "メモ",
    empty: "進捗項目がありません",
  },
  login: {
    title: "ログイン",
    email: "メールアドレス",
    password: "パスワード",
    submit: "ログイン",
    submitting: "ログイン中…",
    failed: "ログインに失敗しました",
  },
  flow: {
    catalog: "モジュール",
    catalogDesc: "システムを選んでAPI連携を構成します",
    searchPlaceholder: "システムを検索…",
    registeredSystems: "登録済みシステム",
    clickToConnect: "クリックで送信先に設定 / ダブルクリックで新規フロー",
    noSystems: "システムが見つかりません",
    hintTitle: "使い方",
    hintClick: "クリック → 選択中の送信モジュールに接続",
    hintDouble: "ダブルクリック → 新しい連携フローを追加",
    hintDrag: "ノードをドラッグして線でつなぐ",
    selectNode: "キャンバス上のモジュールを選択すると、ここで編集できます",
    inspector: "モジュール設定",
    sourceSystem: "送信元システム",
    targetSystem: "送信先システム",
    eventType: "イベント種別",
    fieldMapping: "フィールドマッピング",
    destPath: "送信パス",
    destKey: "配送キー（冪等）",
    scenarioName: "シナリオ名",
    save: "連携を保存",
    addModule: "モジュール追加",
    saved: "連携ルートを保存しました",
    saveValidation: "送信元・送信先・イベントをすべて設定してください",
    pickActionFirst: "先に送信（右）モジュールを選択してください",
    demoMode: "デモデータで表示中",
  },
  map: {
    title: "スフィアマップ",
    desc: "全システム・ルート・IDマッピングを俯瞰",
    statSystems: "システム",
    statRoutes: "ルート",
    statMappings: "ID映射",
    statClients: "クライアント",
    statJobs: "ジョブ",
    routesList: "連携ルート",
    idMappings: "IDマッピング",
    noRoutes: "ルート未登録",
    openFlowEditor: "フロー編集へ",
    routeDetail: "ルート詳細",
    connection: "接続",
    editInFlow: "フローで編集",
    selectHint: "ルートまたはシステムを選択",
    selectHintSub: "キャンバス上の線＝イベント連携、中央＝APOULハブ",
  },
} as const;

const jobStatusLabels: Record<string, string> = {
  pending: "待機中",
  processing: "処理中",
  success: "成功",
  retrying: "リトライ中",
  fail: "失敗",
  dead: "Dead",
};

const systemStatusLabels: Record<string, string> = {
  active: "有効",
  disabled: "停止",
};

const clientStatusLabels: Record<string, string> = {
  active: "有効",
  revoked: "失効",
};

const progressStatusLabels: Record<string, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  done: "完了",
  blocked: "ブロック",
};

export function labelJobStatus(status: string): string {
  return jobStatusLabels[status] ?? status;
}

export function labelSystemStatus(status: string): string {
  return systemStatusLabels[status] ?? status;
}

export function labelClientStatus(status: string): string {
  return clientStatusLabels[status] ?? status;
}

export function labelProgressStatus(status: string): string {
  return progressStatusLabels[status] ?? status;
}

export function chipClassForJob(status: string): string {
  return status;
}

export function chipClassForSystem(status: string): string {
  return status === "active" ? "success" : "cancelled";
}

export function chipClassForClient(status: string): string {
  return status === "active" ? "success" : "dead";
}

export function chipClassForProgress(status: string): string {
  if (status === "done") return "success";
  if (status === "blocked") return "dead";
  if (status === "in_progress") return "processing";
  return "pending";
}

export const JOB_STATUSES = ["", "pending", "processing", "success", "retrying", "fail", "dead"] as const;
