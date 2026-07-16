'use client';

import { useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import HelpTrigger from './HelpTrigger';
import HelpModalShell from './HelpModalShell';

/**
 * Drop-in inline help trigger — click the trigger text to open a modal
 * offering ways to reach our team (WhatsApp / phone call).
 *
 * @param {{
 *   triggerText?: string, title?: string, subTitle?: string, description?: string,
 *   whatsapp?: boolean, phone?: boolean,
 *   whatsappNumber?: string, phoneNumber?: string, whatsappText?: string,
 *   triggerClassName?: string, triggerStyle?: object
 * }} props
 */
export default function ContactHelp({
  triggerText = 'Need help?',
  title = 'Contact Us',
  subTitle,
  description,
  whatsapp = true,
  phone = false,
  whatsappNumber,
  phoneNumber,
  whatsappText = '',
  triggerClassName,
  triggerStyle,
}) {
  const [open, setOpen] = useState(false);

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}${whatsappText ? `?text=${encodeURIComponent(whatsappText)}` : ''}`
    : null;
  const phoneHref = phoneNumber ? `tel:${phoneNumber.replace(/[^0-9+]/g, '')}` : null;

  return (
    <>
      <HelpTrigger
        text={triggerText}
        onClick={() => setOpen(true)}
        className={triggerClassName}
        style={triggerStyle}
      />

      <HelpModalShell open={open} onClose={() => setOpen(false)} title={title} subTitle={subTitle}>
        {description && (
          <p style={{ color: 'var(--tt-text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {whatsapp && whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tt-btn tt-btn-primary"
              style={{ width: '100%' }}
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          )}

          {phone && phoneHref && (
            <a href={phoneHref} className="tt-btn tt-btn-ghost" style={{ width: '100%' }}>
              <Phone size={18} />
              Call Us
            </a>
          )}
        </div>
      </HelpModalShell>
    </>
  );
}
