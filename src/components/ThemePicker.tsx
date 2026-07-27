import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { useStore } from '../store';
import { THEME_PRESETS } from '../types';

export function ThemePicker() {
  const { state, setTheme } = useStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const theme = state.theme;

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="theme-picker" ref={panelRef}>
      <button
        type="button"
        className="btn btn-secondary btn-sm theme-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Palette size={16} aria-hidden />
        Colors
      </button>

      {open && (
        <div className="theme-popover" role="dialog" aria-label="App color scheme">
          <p className="theme-title">App colors</p>
          <p className="theme-help">Pick a preset or set your own primary & accent.</p>

          <div className="theme-presets" role="list">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="listitem"
                className={`theme-swatch ${theme.preset === preset.id ? 'is-active' : ''}`}
                onClick={() =>
                  setTheme({
                    preset: preset.id,
                    primary: preset.primary,
                    accent: preset.accent,
                  })
                }
                aria-pressed={theme.preset === preset.id}
                title={preset.label}
              >
                <span
                  className="theme-swatch-a"
                  style={{ background: preset.primary }}
                />
                <span
                  className="theme-swatch-b"
                  style={{ background: preset.accent }}
                />
                <span className="theme-swatch-label">{preset.label}</span>
              </button>
            ))}
          </div>

          <div className="theme-custom">
            <label>
              Primary
              <input
                type="color"
                value={theme.primary}
                onChange={(e) =>
                  setTheme({
                    preset: 'custom',
                    primary: e.target.value,
                  })
                }
              />
              <input
                type="text"
                value={theme.primary}
                aria-label="Primary hex"
                onChange={(e) =>
                  setTheme({
                    preset: 'custom',
                    primary: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Accent
              <input
                type="color"
                value={theme.accent}
                onChange={(e) =>
                  setTheme({
                    preset: 'custom',
                    accent: e.target.value,
                  })
                }
              />
              <input
                type="text"
                value={theme.accent}
                aria-label="Accent hex"
                onChange={(e) =>
                  setTheme({
                    preset: 'custom',
                    accent: e.target.value,
                  })
                }
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
