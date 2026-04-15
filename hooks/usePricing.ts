'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService, PricingOverride, AdminSettings } from '@/lib/api/admin.service';
import { SmsService } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export function usePricing() {
  const { addToast, hasHydrated, user } = useAppStore();
  const [services, setServices] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number>(-1); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 });
  const [globalSettings, setGlobalSettings] = useState<AdminSettings | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const canLoadAdminData = hasHydrated && user?.role === 'admin';

  const [formData, setFormData] = useState<{ [key: string]: { multiplier: string, fixedPrice: string } }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load selection from localStorage on mount
  useEffect(() => {
    if (!hasHydrated) return;

    const saved = localStorage.getItem('bamzysms_admin_country');
    if (saved) {
      const val = parseInt(saved, 10);
      setSelectedCountry(val === 0 ? -1 : val);
    }
    
    const savedSearch = localStorage.getItem('bamzysms_admin_search');
    if (savedSearch) setSearch(savedSearch);
    setFiltersReady(true);
  }, [hasHydrated]);

  // Save selection to localStorage
  useEffect(() => {
    if (!filtersReady) return;
    localStorage.setItem('bamzysms_admin_country', selectedCountry.toString());
  }, [filtersReady, selectedCountry]);

  useEffect(() => {
    if (!filtersReady) return;
    localStorage.setItem('bamzysms_admin_search', search);
  }, [filtersReady, search]);

  const fetchCountries = useCallback(async () => {
    if (!canLoadAdminData) return;
    try {
      const res = await adminService.getCountries();
      setCountries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch countries', err);
    }
  }, [canLoadAdminData]);

  const fetchPricingData = useCallback(async (page = pagination.page, searchQuery = search, countryId = selectedCountry) => {
    if (!canLoadAdminData) return;
    setLoading(true);
    try {
      const [settingsRes, servicesRes] = await Promise.all([
        adminService.getSettings(),
        adminService.getPaginatedServices({ page, limit: pagination.limit, search: searchQuery, countryId: countryId === -1 ? 0 : countryId })
      ]);

      setGlobalSettings(settingsRes.data);
      setServices(servicesRes.data);
      setPagination(servicesRes.pagination);
      
      const initialForm: { [key: string]: { multiplier: string, fixedPrice: string } } = {};
      servicesRes.data.forEach((s: any) => {
        initialForm[s.code] = {
          multiplier: s.override?.multiplier?.toString() || '',
          fixedPrice: s.override?.fixed_price?.toString() || ''
        };
      });
      setFormData(initialForm);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      addToast('Failed to load pricing data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, canLoadAdminData, pagination.limit, selectedCountry, search, pagination.page]);

  useEffect(() => {
    if (!canLoadAdminData) return;
    fetchCountries();
  }, [canLoadAdminData, fetchCountries]);

  useEffect(() => {
    if (!canLoadAdminData || !filtersReady) return;
    fetchPricingData(1, search, selectedCountry);
  }, [canLoadAdminData, filtersReady, fetchPricingData, search, selectedCountry]);

  const calculateUserPrice = (service: any) => {
    const currentForm = formData[service.code];
    if (currentForm && currentForm.fixedPrice) return parseFloat(currentForm.fixedPrice);
    if (service.override?.fixed_price) return parseFloat(service.override.fixed_price);
    const costPriceNg = service.base_cost_ngn || 320;
    if (globalSettings) {
      const globalMult = parseFloat(globalSettings.price_markup_multiplier || '1.5');
      return Math.ceil(costPriceNg * globalMult);
    }
    return Math.ceil(costPriceNg * 1.5);
  };

  const calculateProfit = (service: any) => {
    const sellingPrice = calculateUserPrice(service);
    const costPrice = service.base_cost_ngn || 320;
    return sellingPrice - costPrice;
  };

  const updateLocalValue = (code: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [code]: { ...prev[code], fixedPrice: value }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (serviceCode: string) => {
    const data = formData[serviceCode];
    if (!data) return;
    try {
      await adminService.updatePricingOverride({
        serviceCode,
        countryId: selectedCountry === -1 ? 0 : selectedCountry,
        fixedPrice: data.fixedPrice ? parseFloat(data.fixedPrice) : undefined
      });
      addToast(`Price updated for ${serviceCode}`, 'success');
      // No need to refresh everything if only one was saved, but let's keep it robust
      // setHasUnsavedChanges is better handled by checking all changes but for simplicity:
    } catch (err: any) {
      addToast(err.message || 'Failed to update', 'error');
    }
  };

  const handleSaveAllChanges = async () => {
    const updates: { serviceCode: string; fixedPrice: number }[] = [];
    
    services.forEach(s => {
      const currentVal = formData[s.code]?.fixedPrice;
      const originalVal = s.override?.fixed_price?.toString() || '';
      
      if (currentVal && currentVal !== originalVal) {
        updates.push({
          serviceCode: s.code,
          fixedPrice: parseFloat(currentVal)
        });
      }
    });

    if (updates.length === 0) {
      addToast('No changes to save.', 'info');
      return;
    }

    setLoading(true);
    try {
      await adminService.bulkUpdatePricingOverrides({
        countryId: selectedCountry === -1 ? 0 : selectedCountry,
        overrides: updates
      });
      addToast(`Successfully saved ${updates.length} pricing changes.`, 'success');
      await fetchPricingData();
    } catch (err: any) {
      addToast('Failed to save bulk changes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Remove this price override? This will reset it to the global default markup.')) return;
    try {
      await adminService.deletePricingOverride(code, selectedCountry === -1 ? 0 : selectedCountry);
      addToast('Override removed', 'success');
      await fetchPricingData();
    } catch (err: any) {
      addToast('Failed to delete', 'error');
    }
  };

  const applyBulkMarkup = () => {
    if (!globalSettings) return;
    const multiplier = parseFloat(globalSettings.price_markup_multiplier || '1.5');
    setFormData(prev => {
        const next = { ...prev };
        services.forEach(s => {
            const costPriceNg = s.base_cost_ngn || 320;
            const targetPrice = Math.ceil(costPriceNg * multiplier);
            next[s.code] = { ...next[s.code], fixedPrice: targetPrice.toString() };
        });
        return next;
    });
    setHasUnsavedChanges(true);
    addToast('Global markup applied. Click "Save All" to persist these changes.', 'info');
  };

  const updateGlobalSettings = async (updates: Partial<AdminSettings>) => {
    setLoading(true);
    try {
      await adminService.updateSettings(updates);
      addToast('Global settings updated successfully', 'success');
      await fetchPricingData();
    } catch (err: any) {
      addToast('Failed to update global settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    fetchPricingData(page, search);
  };

  return {
    services,
    loading,
    search,
    setSearch,
    pagination,
    setPage,
    calculateUserPrice,
    calculateProfit,
    handleDelete,
    handleSave,
    handleSaveAllChanges,
    updateLocalValue,
    formData,
    hasUnsavedChanges,
    globalSettings,
    countries,
    selectedCountry,
    setSelectedCountry,
    applyBulkMarkup,
    updateGlobalSettings
  };
}
