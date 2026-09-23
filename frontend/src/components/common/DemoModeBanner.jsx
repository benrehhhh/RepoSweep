export default function DemoModeBanner() {
  return (
    <div className="demo-banner-row" role="status">
      <i className="bi bi-flask" aria-hidden="true" />
      <span>
        <strong>Demo mode.</strong> These are sample repositories — not real GitHub
        data. Connect GitHub OAuth to work with your actual repositories.
      </span>
    </div>
  );
}