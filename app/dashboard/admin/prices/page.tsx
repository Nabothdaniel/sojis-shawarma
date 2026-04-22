'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePricing } from '@/hooks/usePricing';
import PricingSkeleton from '@/components/admin/PricingSkeleton';
import { 
  RiDeleteBinLine, 
  RiInformationLine, RiPulseLine, RiArrowLeftSLine, 
  RiArrowRightSLine, RiSave3Line, RiEditLine, RiQuestionLine, RiBookOpenLine, RiCloseLine,
  RiRefreshLine, RiDashboardLine, RiPercentLine, RiMoneyDollarCircleLine
} from 'react-icons/ri';
import SearchableDropdown from '@/components/admin/SearchableDropdown';
import Tooltip from '@/components/ui/Tooltip';
import { formatMoney, formatNumber } from '@/lib/utils';

const PRICING_TERMS = [
  {
    title: 'Provider Price',
    body: 'The raw cost you pay upstream after converting the provider USD rate into naira using your current exchange rate.',
  },
  {
    title: 'Selling Price',
    body: 'The final customer-facing amount. It can come from your global markup or a manual fixed override for a service and country.',
  },
  {
    title: 'Profit Margin',
    body: 'Selling price minus provider cost. Negative values mean you are selling below cost and losing money on that service.',
  },
  {
    title: 'Global Rate',
    body: 'Your default NGN per USD conversion. This controls how every provider price is translated before markup is applied.',
  },
  {
    title: 'Default Markup',
    body: 'The default multiplier applied when a row has no service-specific override. Example: 1.5x turns 1,000 into 1,500.',
  },
  {
    title: 'Country Override',
    body: 'A custom price saved for one country. Global values still power every other country that does not have its own override.',
  },
];

export default function AdminPricePage() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState({ rate: '', multiplier: '' });

  const {
    services, loading, search, setSearch,
    pagination, setPage, calculateUserPrice,
    calculateProfit, handleDelete, handleSave, 
    handleSaveAllChanges, updateLocalValue, 
    formData, hasUnsavedChanges, globalSettings,
    countries, selectedCountry, setSelectedCountry,
    applyBulkMarkup, updateGlobalSettings, refreshLiveRate, busy
  } = usePricing();

  React.useEffect(() => {
    if (globalSettings) {
      setModalData({
        rate: globalSettings.usd_to_ngn_rate || '1600',
        multiplier: globalSettings.price_markup_multiplier || '1.5'
      });
    }
  }, [globalSettings]);

  const onSettingsSave = async () => {
    await updateGlobalSettings({
      usd_to_ngn_rate: modalData.rate,
      price_markup_multiplier: modalData.multiplier
    });
    setIsSettingsModalOpen(false);
  };

  const countryOptions = [
    { id: -1, name: '🌎 All Countries (Global)' },
    ...countries
      .filter(c => c.id !== null && c.id !== undefined)
      .map(c => ({ 
        id: Number(c.id), 
        name: c.eng,
        flag: c.flag
      }))
  ];

  return (
    <AdminLayout>
      <div className="admin-content" style={{ padding: '32px' }}>
        <div className="admin-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px' }}>Price Management</h1>
            <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>Manage margins by comparing provider costs and selling prices per country.</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="search-container" style={{ position: 'relative' }}>
               <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Services</label>
               <input 
                 type="text" 
                 placeholder="Search services..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="input-field" 
                 style={{ width: '220px', padding: '10px 16px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', fontWeight: 600 }}
               />
            </div>
            
            <SearchableDropdown 
              label="Select Country"
              value={selectedCountry}
              onChange={(val) => setSelectedCountry(Number(val))}
              options={countryOptions}
            />
          </div>
        </div>

        {/* Global Parameters Context Bar */}
        <div style={{ 
          display: 'flex', gap: 16, marginBottom: '32px', padding: '16px 24px', 
          background: hasUnsavedChanges ? 'var(--color-primary-dim)' : '#FFFFFF', 
          border: `1px solid ${hasUnsavedChanges ? 'var(--color-primary)' : 'var(--color-border)'}`, 
          borderRadius: '16px', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          transition: 'all 0.3s'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiInformationLine size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Config:</span>
           </div>
           <div style={{ height: '16px', width: '1px', background: 'var(--color-border)' }} />
           <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Rate:
              <span style={{ color: 'var(--color-primary)' }}>{formatMoney(globalSettings?.usd_to_ngn_rate)} / USD</span>
              <Tooltip content="This is the exchange rate used to convert provider USD costs into naira before markup.">
                <span style={{ display: 'inline-flex', color: 'var(--color-text-faint)', cursor: 'help' }}><RiQuestionLine size={14} /></span>
              </Tooltip>
           </div>
           <div style={{ height: '16px', width: '1px', background: 'var(--color-border)' }} />
           <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Default Markup:
              <span style={{ color: 'var(--color-primary)' }}>{globalSettings?.price_markup_multiplier || '1.5'}x</span>
              <Tooltip content="Rows without a custom override use this multiplier automatically.">
                <span style={{ display: 'inline-flex', color: 'var(--color-text-faint)', cursor: 'help' }}><RiQuestionLine size={14} /></span>
              </Tooltip>
           </div>
           
           <div style={{ height: '16px', width: '1px', background: 'var(--color-border)' }} />
           
           <button 
             onClick={refreshLiveRate}
             disabled={busy}
             style={{
               background: 'transparent', color: 'var(--color-text)',
               border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '8px', 
               fontSize: '0.75rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
               display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
             }}
           >
             <RiRefreshLine size={14} className={busy ? 'spin-icon' : ''} />
             {busy ? 'UPDATING...' : 'REFRESH EXCHANGE RATE'}
           </button>

           <button 
             onClick={() => setIsSettingsModalOpen(true)}
             style={{
               background: 'var(--color-primary-dim)', color: 'var(--color-primary)',
               border: 'none', padding: '6px 12px', borderRadius: '8px', 
               fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
               display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
             }}
             className="edit-settings-btn"
           >
             <RiEditLine size={14} />
             EDIT
           </button>

           {hasUnsavedChanges && (
             <>
               <div style={{ height: '16px', width: '1px', background: 'var(--color-border)' }} />
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <RiPulseLine className="pulse-icon" />
                  Unsaved Edits Pending
               </div>
             </>
           )}

           <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <button 
                onClick={() => applyBulkMarkup()}
                className="btn-secondary"
                style={{ scale: '0.9', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RiPercentLine />
                Set Page to Default Markup
              </button>
              
              {hasUnsavedChanges && (
                <button 
                  onClick={handleSaveAllChanges}
                  className="btn-primary"
                  style={{ scale: '0.9', padding: '8px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <RiSave3Line size={18} />
                  Save All
                </button>
              )}

              <button
                onClick={() => setIsGuideOpen(true)}
                className="btn-secondary"
                style={{ scale: '0.9', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RiBookOpenLine size={16} />
                Pricing Guide
              </button>
           </div>
        </div>

        <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
               <PricingSkeleton />
               <p style={{ marginTop: '20px', color: 'var(--color-text-faint)', fontWeight: 600 }}>Synchronizing service data...</p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Service</th>
                      <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, width: '150px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          Provider Price
                          <Tooltip content="Your converted upstream cost before markup.">
                            <span style={{ display: 'inline-flex', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                          </Tooltip>
                        </span>
                      </th>
                      <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, width: '220px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          Selling Strategy / Price
                          <Tooltip content="Set a Fixed Amount or a Multiplier. Multipliers adjust automatically if costs change.">
                            <span style={{ display: 'inline-flex', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                          </Tooltip>
                        </span>
                      </th>
                      <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, width: '150px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          Profit Margin
                          <Tooltip content="Selling price minus provider cost. Target > 30% for safety.">
                            <span style={{ display: 'inline-flex', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                          </Tooltip>
                        </span>
                      </th>
                      <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!services || services.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                          No services found matching &quot;{search}&quot;
                        </td>
                      </tr>
                    ) : (
                      services.map(s => {
                        const rowForm = formData[s.code] || { fixedPrice: '', multiplier: '' };
                        const isDirty = s.override?.fixed_price?.toString() !== rowForm.fixedPrice || s.override?.multiplier?.toString() !== rowForm.multiplier;
                        const profit = calculateProfit(s, rowForm);
                        const userPrice = calculateUserPrice(s, rowForm);
                        const costPrice = s.base_cost_ngn || 320;

                        return (
                          <tr key={s.code} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                  <RiPulseLine size={16} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                   <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem' }}>{s.name}</span>
                                   <code style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', opacity: 0.6 }}>{s.code}</code>
                                </div>
                              </div>
                            </td>
                            {/* COST PRICE */}
                            <td style={{ padding: '16px 24px' }}>
                               <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                  {formatMoney(costPrice)}
                               </div>
                               <div style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)' }}>
                                  {formatMoney(costPrice / Number(globalSettings?.usd_to_ngn_rate || 1600), 'USD')}
                               </div>
                            </td>
                            {/* SELLING PRICE INPUT */}
                             <td style={{ padding: '16px 24px' }}>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {/* Multiplier Option */}
                                  <div style={{ position: 'relative', width: '180px' }}>
                                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.75rem', fontWeight: 800 }}>X</span>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={rowForm.multiplier || ''}
                                        placeholder={`${s.effective_multiplier}x`}
                                        onChange={(e) => updateLocalValue(s.code, 'multiplier', e.target.value)}
                                        className="input-field-sm"
                                        style={priceInputStyle(isDirty, profit)}
                                      />
                                      <label style={{ position: 'absolute', left: '-10px', top: '-10px', fontSize: '8px', background: 'var(--color-bg-2)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: 800 }}>MULT</label>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', width: '180px' }}>
                                    <div style={{ height: '1px', width: '100%', background: 'var(--color-border)', opacity: 0.5 }} />
                                    <span style={{ fontSize: '8px', padding: '0 8px', color: 'var(--color-text-faint)', fontWeight: 800 }}>OR FIXED</span>
                                    <div style={{ height: '1px', width: '100%', background: 'var(--color-border)', opacity: 0.5 }} />
                                  </div>

                                  {/* Fixed Price Option */}
                                  <div style={{ position: 'relative', width: '180px' }}>
                                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.85, fontSize: '0.85rem' }}>₦</span>
                                      <input 
                                        type="number"
                                        value={rowForm.fixedPrice || ''}
                                        placeholder={formatNumber(userPrice)}
                                        onChange={(e) => updateLocalValue(s.code, 'fixedPrice', e.target.value)}
                                        className="input-field-sm"
                                        style={priceInputStyle(isDirty, profit)}
                                      />
                                  </div>
                               </div>
                               
                               {!s.override && !isDirty && (
                                    <div style={{ 
                                      marginTop: 8,
                                      background: 'var(--color-primary-dim)', color: 'var(--color-primary)', 
                                      fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, 
                                      textTransform: 'uppercase', width: 'fit-content'
                                    }}>
                                      Following Global Rule
                                    </div>
                                  )}
                             </td>

                            {/* PROFIT MARGIN */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ 
                                 fontSize: '0.95rem', fontWeight: 800, 
                                 color: profit > 0 ? '#10B981' : (profit < 0 ? '#EF4444' : 'var(--color-text-faint)')
                                }}>
                                {formatMoney(profit)}
                                <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>
                                   {((profit / costPrice) * 100).toFixed(1)}% {profit <= 0 ? (profit === 0 ? 'Margin' : 'Loss') : 'Profit'}
                                </div>
                               </div>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {isDirty ? (
                                  <button 
                                    onClick={() => handleSave(s.code)} 
                                    className="btn-primary" 
                                    style={{ padding: '8px 16px', borderRadius: '10px', height: '38px', fontSize: '0.85rem', fontWeight: 800, background: profit <= 0 ? '#EF4444' : 'var(--color-primary)' }}
                                  >
                                    Save
                                  </button>
                                ) : (
                                  s.override && (
                                    <button onClick={() => handleDelete(s.code)} className="action-btn-red" title="Reset to global default">
                                      <RiDeleteBinLine size={18} />
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.02)' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>
                    Showing page <b>{pagination.page}</b> of <b>{pagination.pages}</b>
                 </div>
                 <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => setPage(pagination.page - 1)} 
                      disabled={pagination.page <= 1}
                      className="pagination-btn"
                    >
                       <RiArrowLeftSLine size={20} />
                    </button>
                    <button 
                      onClick={() => setPage(pagination.page + 1)} 
                      disabled={pagination.page >= pagination.pages}
                      className="pagination-btn"
                    >
                       <RiArrowRightSLine size={20} />
                    </button>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Settings Modal */}
      {isSettingsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Global Price Parameters</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-faint)', marginBottom: '8px', textTransform: 'uppercase' }}>Exchange Rate (NGN/USD)</label>
                <input 
                  type="number" 
                  value={modalData.rate} 
                  onChange={e => setModalData({...modalData, rate: e.target.value})}
                  className="input-field"
                  placeholder="e.g. 1600"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-faint)', marginBottom: '8px', textTransform: 'uppercase' }}>Default Markup Multiplier</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={modalData.multiplier} 
                  onChange={e => setModalData({...modalData, multiplier: e.target.value})}
                  className="input-field"
                  placeholder="e.g. 1.5"
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={onSettingsSave}>
                Save Platform Changes
              </button>
              <button className="btn-ghost" onClick={() => setIsSettingsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isGuideOpen && (
        <div className="modal-overlay" onClick={() => setIsGuideOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', padding: '28px' }}>
            <button
              onClick={() => setIsGuideOpen(false)}
              className="btn-ghost"
              style={{ position: 'absolute', top: 16, right: 16, padding: 8, minWidth: 'auto', border: 'none' }}
            >
              <RiCloseLine size={22} />
            </button>

            <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: '999px', background: 'var(--color-primary-dim)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
                <RiBookOpenLine size={16} />
                Admin Guide
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.45rem', fontWeight: 800 }}>Pricing terminology, explained clearly</h2>
              <p style={{ margin: 0, color: 'var(--color-text-faint)', lineHeight: 1.6 }}>
                This page is where you protect margin, react to provider price swings, and tailor prices by country without losing track of the default system rules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {PRICING_TERMS.map((term) => (
                <div key={term.title} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '16px', background: 'var(--color-bg-2)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px', color: 'var(--color-text)' }}>{term.title}</div>
                  <div style={{ fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--color-text-faint)' }}>{term.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .edit-settings-btn:hover {
          background: var(--color-primary-glow) !important;
          transform: translateY(-1px);
        }
        .action-btn-red {
          width: 36px; height: 36px; border-radius: 8px; border: none; cursor: pointer;
          background: rgba(239, 68, 68, 0.1); color: #ef4444; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .pagination-btn {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--color-border);
          background: #FFFFFF; color: var(--color-text); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .user-row:hover { background: var(--color-bg-hover) !important; }
        .spin-icon { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .input-field-sm {
          width: 100%; height: 38px; padding: 8px 12px;
          border-radius: 10px; font-size: 0.95rem; font-weight: 700;
          outline: none; transition: all 0.2s;
          background: #fff; color: var(--color-text);
        }
        .input-field-sm:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-glow); }

        @media (max-width: 1024px) {
          .admin-content { padding: 20px 16px !important; }
          .admin-header { flex-direction: column; align-items: flex-start !important; gap: 20px; }
          .search-container { width: 100%; }
          .search-container input { width: 100% !important; }
        }
      `}</style>
    </AdminLayout>
  );
}

const priceInputStyle = (isDirty: boolean, profit: number): React.CSSProperties => ({
  border: profit <= 0 ? '1.5px solid var(--color-error)' : (isDirty ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)'),
  paddingLeft: '28px',
});
