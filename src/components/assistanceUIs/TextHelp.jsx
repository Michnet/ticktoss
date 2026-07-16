'use client';

import { useState } from 'react';
import HelpTrigger from './HelpTrigger';
import HelpModalShell from './HelpModalShell';

/**
 * Drop-in inline help trigger — click the trigger text to open a modal
 * explaining some part of the UI.
 *
 * @param {{ triggerText?: string, title?: string, subTitle?: string, description: string, triggerClassName?: string, triggerStyle?: object }} props
 */
export default function TextHelp({
  triggerText = 'Learn more',
  title,
  subTitle,
  description,
  triggerClassName,
  triggerStyle,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <HelpTrigger
        text={triggerText}
        onClick={() => setOpen(true)}
        className={triggerClassName}
        style={triggerStyle}
      />

      <HelpModalShell open={open} onClose={() => setOpen(false)} title={title} subTitle={subTitle}>
        <p style={{ color: 'var(--tt-text)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {description}
        </p>
      </HelpModalShell>
    </>
  );
}
