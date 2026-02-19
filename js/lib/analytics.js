/* global gtag */
export function initAnalytics() {
  /**
   * GA4 Custom Event Sending Function
   */
  function sendGAEvent(eventName, eventParams = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }

  /**
   * Get formatted log events
   */
  document
    .querySelector('#view_formatted_log')
    ?.addEventListener('click', () => {
      sendGAEvent('view_formatted_log', {
        event_category: 'engagement',
        event_label: 'view_formatted_log_button',
      });
    });

  /**
   * Get configure events
   */
  document.querySelector('#configure')?.addEventListener('click', () => {
    sendGAEvent('configure', {
      event_category: 'engagement',
      event_label: 'configure_button',
    });
  });

  /**
   * Get help events
   */
  document.querySelector('#help_button')?.addEventListener('click', () => {
    sendGAEvent('help', {
      event_category: 'engagement',
      event_label: 'help_button',
    });
  });

  /**
   * Get export events
   */
  document
    .querySelector('#download_formatted_log')
    ?.addEventListener('click', () => {
      sendGAEvent('export_log', {
        event_category: 'engagement',
        event_label: 'export',
      });
    });

  /**
   * Get PWA install events
   */
  window.addEventListener('appinstalled', () => {
    sendGAEvent('pwa_install', {
      event_category: 'engagement',
      event_label: 'pwa_install',
    });
  });
}
