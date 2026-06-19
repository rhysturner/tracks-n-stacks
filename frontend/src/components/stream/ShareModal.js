import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || 'Check out this live stream!');

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: 'Facebook',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'WhatsApp',
      icon: '💬',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write unavailable in this context
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Share Live Stream</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={styles.qrSection}>
          <div style={styles.qrWrapper}>
            <QRCodeSVG
              value={url}
              size={160}
              bgColor="#1a1a2e"
              fgColor="#ffffff"
              level="M"
            />
          </div>
          <p style={styles.qrHint}>Scan to open on another device</p>
        </div>

        <div style={styles.socialSection}>
          <p style={styles.socialLabel}>Share on</p>
          <div style={styles.socialButtons}>
            {shareLinks.map(({ label, icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialBtn}
                title={`Share on ${label}`}
              >
                <span style={styles.socialIcon}>{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div style={styles.copySection}>
          <input
            style={styles.linkInput}
            type="text"
            value={url}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button style={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    lineHeight: 1,
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  qrWrapper: {
    background: '#1a1a2e',
    border: '2px solid #2a2a4a',
    borderRadius: '12px',
    padding: '12px',
    display: 'inline-flex',
  },
  qrHint: {
    color: '#666',
    fontSize: '0.78rem',
    marginTop: '10px',
    marginBottom: 0,
  },
  socialSection: {
    marginBottom: '20px',
  },
  socialLabel: {
    color: '#888',
    fontSize: '0.78rem',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  socialButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0d0d1a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#ccc',
    padding: '8px 12px',
    fontSize: '0.82rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'border-color 0.2s, color 0.2s',
    flex: '1 1 auto',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  },
  socialIcon: {
    fontSize: '0.9rem',
    fontWeight: 700,
  },
  copySection: {
    display: 'flex',
    gap: '8px',
  },
  linkInput: {
    flex: 1,
    background: '#0d0d1a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#aaa',
    padding: '8px 10px',
    fontSize: '0.78rem',
    fontFamily: 'monospace',
    outline: 'none',
    minWidth: 0,
  },
  copyBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
