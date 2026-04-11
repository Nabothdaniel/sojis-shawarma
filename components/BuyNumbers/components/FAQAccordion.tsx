import React from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { FAQItem } from '../types';

interface FAQAccordionProps {
  items: FAQItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, openId, setOpenId }) => {
  return (
    <>
      {items.map((faq) => (
        <div key={faq.id} className={`accordion-item ${openId === faq.id ? 'open' : ''}`}>
          <button
            className="accordion-trigger"
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
          >
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{faq.title}</span>
            <RiArrowDownSLine
              size={18}
              color="var(--color-text-faint)"
              style={{ transform: openId === faq.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            />
          </button>
          {openId === faq.id && (
            <div className="accordion-content">{faq.content}</div>
          )}
        </div>
      ))}
    </>
  );
};
