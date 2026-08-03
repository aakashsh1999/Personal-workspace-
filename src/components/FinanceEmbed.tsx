import { ExternalLink, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { TRACKER_URL, trackerEmbedUrl } from '../lib/apps';

export function FinanceEmbed() {
  const [key, setKey] = useState(0);
  const src = trackerEmbedUrl();

  const reload = useCallback(() => setKey((k) => k + 1), []);

  return (
    <div className="finance-embed">
      <div className="finance-embed-bar">
        <div className="finance-embed-copy">
          <p className="finance-embed-title">Finances</p>
          <p className="finance-embed-sub">
            AllPay expense tracker — stays inside Orbit so you can switch spaces anytime.
          </p>
        </div>
        <div className="finance-embed-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={reload}
            aria-label="Reload tracker"
          >
            <RefreshCw size={15} />
            Reload
          </button>
          <a
            className="btn btn-ghost btn-sm"
            href={TRACKER_URL}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={15} />
            Open separately
          </a>
        </div>
      </div>
      <iframe
        key={key}
        className="finance-embed-frame"
        src={src}
        title="AllPay finance tracker"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
