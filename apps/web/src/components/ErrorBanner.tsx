type Props = { message: string };

export function ErrorBanner({ message }: Props) {
  return (
    <div className="err-banner" role="alert">
      <strong>エラー</strong>
      <span>{message}</span>
    </div>
  );
}
