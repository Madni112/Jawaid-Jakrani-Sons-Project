import { useState, useEffect } from 'react';
import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';

export const usePurchaseReturnReceiptMetadata = (isEditMode: boolean, editData: any) => {
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [vendorOptions, setVendorOptions] = useState<any[]>([]);
  const [returnOptions, setReturnOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);
  const [generatedReceiptNo, setGeneratedReceiptNo] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);

        // 1. Fetch Vendors
        const { data: vData } = await supabase.from('vendors').select('*').order('vendor_name', { ascending: true });
        const normalizedVendors = (vData || []).map((v: any) => ({
          ...v,
          vendor_name: v.vendor_name || v.name || 'Unnamed Vendor',
        }));
        setVendorOptions(normalizedVendors);

        // 2. Fetch Banks & COA
        const { data: bankData } = await supabase.from('banks').select('id, bankName, accountTitle, accountNumber');
        const { data: coaData } = await supabase
          .from('chart_of_accounts')
          .select('account_code, account_title, control_code, category_code');

        if (bankData) setBankAccounts(bankData);
        if (coaData) setCoaAccounts(coaData);

        // 3. Fetch all Purchase Returns (group split dispatches into parent return & sort newest date first)
        const { data: rData } = await supabase
          .from('purchase_returns')
          .select('*');

        if (rData) {
          const parentMap: Record<string, any> = {};
          const childList: any[] = [];

          rData.forEach((r: any) => {
            const isChild = Boolean(
              r.metadata?.parent_return_id ||
              r.metadata?.parent_return_no ||
              String(r.remarks || '').toLowerCase().includes('remaining hold items from')
            );
            if (isChild) {
              childList.push(r);
            } else {
              parentMap[String(r.id)] = {
                ...r,
                childDispatches: []
              };
            }
          });

          childList.forEach((child: any) => {
            const pId = child.metadata?.parent_return_id;
            const pNo = child.metadata?.parent_return_no || (child.return_no || '').replace(/-[A-Z]+$/i, '');
            let parent = pId ? parentMap[String(pId)] : null;
            if (!parent && pNo) {
              parent = Object.values(parentMap).find(p => (p.return_no || '').toUpperCase() === pNo.toUpperCase());
            }

            if (parent) {
              parent.childDispatches.push(child);
            } else {
              parentMap[String(child.id)] = {
                ...child,
                childDispatches: []
              };
            }
          });

          const sortedReturns = Object.values(parentMap).sort((a: any, b: any) => {
            const dateA = new Date(a.return_date || a.created_at || 0).getTime();
            const dateB = new Date(b.return_date || b.created_at || 0).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return Number(b.id || 0) - Number(a.id || 0);
          });

          setReturnOptions(sortedReturns);
        }

        if (!isEditMode) {
          // Fetch next VRV sequence
          try {
            const { data: vrvRows } = await supabase
              .from('financial_vouchers')
              .select('voucher_no')
              .ilike('voucher_no', 'VRV-%');

            let maxSeq = 0;
            (vrvRows || []).forEach((r: any) => {
              const match = String(r.voucher_no || '').match(/VRV-(\d+)/i);
              if (match && match[1]) {
                const n = parseInt(match[1], 10);
                if (n > maxSeq) maxSeq = n;
              }
            });
            setGeneratedReceiptNo(`VRV-${String(maxSeq + 1).padStart(3, '0')}`);
          } catch {
            setGeneratedReceiptNo(`VRV-${Math.floor(100 + Math.random() * 900)}`);
          }
        }
      } catch (err: any) {
        console.error(err.message);
        toast.error('Failed to load receipt metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [isEditMode, editData]);

  return {
    metadataLoading,
    vendorOptions,
    returnOptions,
    bankAccounts,
    coaAccounts,
    generatedReceiptNo,
  };
};
