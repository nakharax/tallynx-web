import React, { useState } from 'react';
import { Download, Share, X, WifiOff } from 'lucide-react';
import { Language } from '../utils/i18n';
import { useOnlineStatus, type PWAInstallState } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  lang: Language;
  installState: PWAInstallState;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  installState,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = installState;
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isTh = lang === 'th';

  React.useEffect(() => {
    if (!showIOSGuide) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIOSGuide(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        data-testid="pwa-install-btn"
        onClick={install}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-focus/35 bg-focus/10 font-semibold text-focus hover:bg-accent-solid hover:text-white dark:border-focus/35 dark:bg-focus/15 dark:text-focus dark:hover:bg-accent-solid dark:hover:text-white transition cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{isTh ? 'ติดตั้งแอป TallyNX (PWA)' : 'Install TallyNX App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          data-testid="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C7] bg-white px-2.5 py-1.5 font-medium text-[#141618] hover:border-focus dark:border-neutral-800 dark:bg-[#1B1E21] dark:text-neutral-200 dark:hover:border-focus transition cursor-pointer ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          <Share className="h-3.5 w-3.5 text-focus shrink-0" />
          <span>{isTh ? 'เพิ่มลงหน้าจอโฮม iOS' : 'Add to Home Screen'}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isTh ? 'วิธีติดตั้งบน iOS Safari' : 'Install on iPhone / iPad'}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#D6D1C7] bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#1B1E21]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#141618] dark:text-white">
                  {isTh
                    ? 'ติดตั้ง TallyNX OS บน iPhone / iPad'
                    : 'Install TallyNX OS on iOS'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#2B2D2F] hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[#2B2D2F] dark:text-neutral-300 list-decimal pl-4">
                <li>
                  {isTh
                    ? 'แตะไอคอน แชร์ (Share) ที่แถบเครื่องมือ Safari ด้านล่าง'
                    : 'Tap the Share button in Safari toolbar.'}
                </li>
                <li>
                  {isTh
                    ? 'เลื่อนลงแล้วเลือก เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)'
                    : 'Scroll down and tap Add to Home Screen.'}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-accent-solid py-2 text-xs font-semibold text-white hover:brightness-95 transition cursor-pointer"
              >
                {isTh ? 'เข้าใจแล้ว' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  const isTh = lang === 'th';

  if (isOnline) return null;

  return (
    <div
      role="status"
      data-testid="pwa-offline-indicator"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-[#1B1E21]/95 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span>
        {isTh
          ? 'ออฟไลน์ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
          : 'Offline — Check your internet connection'}
      </span>
    </div>
  );
};
