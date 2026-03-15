import React from 'react';
import { RiWhatsappLine, RiTelegramLine } from 'react-icons/ri';

export default function SupportFAB() {
  return (
    <div className="support-fab">
      <a
        href="https://t.me/bamzysms"
        target="_blank"
        rel="noopener noreferrer"
        className="support-btn"
        aria-label="Telegram Support"
        style={{ background: '#229ED9' }}
      >
        <RiTelegramLine size={24} color="#fff" />
      </a>
      <a
        href="https://wa.me/234000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="support-btn"
        aria-label="WhatsApp Support"
        style={{ background: '#25D366' }}
      >
        <RiWhatsappLine size={24} color="#fff" />
      </a>
    </div>
  );
}
