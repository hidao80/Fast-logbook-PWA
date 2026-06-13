import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Slide-in side drawer using Bootstrap offcanvas. Closes on Escape or backdrop click.
 *
 * @param props.isOpen - whether the drawer is visible
 * @param props.onClose - callback invoked on close
 * @param props.title - text shown in the offcanvas header
 * @param props.children - body content
 * @returns portal-rendered offcanvas element, or null when closed
 * @example <Drawer isOpen={open} onClose={() => setOpen(false)} title="Menu">...</Drawer>
 */
export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="offcanvas offcanvas-start show"
        style={{ visibility: 'visible' }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{title}</h5>
          <button
            type="button"
            className="btn-close"
            data-bs-theme="light"
            onClick={onClose}
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">{children}</div>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative backdrop; Escape key handled by useEffect above */}
      <div
        className="offcanvas-backdrop fade show"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />
    </>,
    document.body,
  );
}
