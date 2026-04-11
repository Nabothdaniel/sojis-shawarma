'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService, PricingOverride } from '@/lib/api/admin.service';
import { smsService, SmsService } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiInformationLine, RiPulseLine } from 'react-icons/ri';

export default function AdminPricePage() {
  const { addToast } = useAppStore();
  const [services, setServices] = useState<SmsService[]>([]);
  const [overrides, setOverrides] = useState<PricingOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<SmsService | null>(null);
  const [formData, setFormData] = useState({ multiplier: '', fixedPrice: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servRes, overRes] = await Promise.all([
          smsService.getSmsBowerServices(),
          adminService.getPricingOverrides()
        ]);
        setServices(servRes.data);
        setOverrides(overRes.data);
      } catch (err: any) {
        addToast('Failed to load pricing data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const handleEdit = (service: SmsService) => {
    const existing = overrides.find(o => o.service_code === service.code);
    setCurrentService(service);
    setFormData({
      multiplier: existing?.multiplier?.toString() || '',
      fixedPrice: existing?.fixed_price?.toString() || ''
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentService) return;
    try {
      await adminService.updatePricingOverride({
        serviceCode: currentService.code,
        multiplier: formData.multiplier ? parseFloat(formData.multiplier) : undefined,
        fixedPrice: formData.fixedPrice ? parseFloat(formData.fixedPrice) : undefined
      });
      addToast(`Price override updated for ${currentService.name}`, 'success');
      
      // Refresh overrides
      const res = await adminService.getPricingOverrides();
      setOverrides(res.data);
      setEditModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update', 'error');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Remove this override?')) return;
    try {
      await adminService.deletePricingOverride(code);
      setOverrides(overrides.filter(o => o.service_code !== code));
      addToast('Override removed', 'success');
    } catch (err: any) {
      addToast('Failed to delete', 'error');
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px' }}>Price Management</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Configure service-specific markups and fixed prices.</p>
          </div>
          <div style={{ position: 'relative' }}>
             <input 
               type="text" 
               placeholder="Search services..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="input-field" 
               style={{ width: '280px', padding: '12px 16px' }}
             />
          </div>
        </div>

        {loading ? (
             <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a0a0b', borderBottom: '1px solid #1a1a1c' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Code</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Markup</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(s => {
                  const override = overrides.find(o => o.service_code === s.code);
                  return (
                    <tr key={s.code} style={{ borderBottom: '1px solid #1a1a1c' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>{s.code}</td>
                      <td style={{ padding: '16px' }}>
                        {override ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {override.multiplier && <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--color-primary)' }}>{override.multiplier}x Multiplier</span>}
                            {override.fixed_price && <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>₦{override.fixed_price} Fixed</span>}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>Global Default</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(s)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '8px' }}>
                             <RiEditLine size={18} />
                          </button>
                          {override && (
                            <button onClick={() => handleDelete(s.code)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '8px' }}>
                               <RiDeleteBinLine size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && currentService && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
            <div className="stat-card" style={{ width: '400px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px' }}>Override: {currentService.name}</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Multiplier (e.g. 1.8)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="input-field" 
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  placeholder="Leave empty for global default"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Fixed Price in NGN (Override multiplier)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.fixedPrice}
                  onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                  placeholder="e.g. 2500"
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setEditModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                <button onClick={handleSave} className="btn-primary" style={{ flex: 1, padding: '12px' }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
