import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  fullscreen?: boolean;
}

/**
 * Bootstrap modal dialog rendered via a portal. Closes on Escape or outside click.
 *
 * @param props.isOpen - whether the modal is visible
 * @param props.onClose - optional callback invoked on close; omit to make modal non-dismissible
 * @param props.title - text shown in the modal header
 * @param props.children - body content
 * @param props.footer - optional footer slot
 * @param props.fullscreen - when true, uses Bootstrap's fullscreen modal variant
 * @returns portal-rendered modal element, or null when closed
 * @example <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm">...</Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  fullscreen,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
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
        className="modal fade show"
        style={{ display: 'block' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose?.();
        }}
      >
        <div className={`modal-dialog${fullscreen ? ' modal-fullscreen' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              {onClose && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                />
              )}
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
}
