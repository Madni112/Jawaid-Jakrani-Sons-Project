import React from 'react';
import { getBrandConfig } from '../../../../utils/brand';

interface PurchaseReportSignatureBlockProps {
  businessName?: string;
}

export const PurchaseReportSignatureBlock: React.FC<PurchaseReportSignatureBlockProps> = ({
  businessName
}) => {
  return (
    <>
      {/* ── FORMAL MULTI-LEVEL EXECUTIVE SIGNATURE BLOCK ── */}
      <div className="mt-16 grid grid-cols-3 gap-10 text-center text-[10px] font-sans font-black uppercase tracking-wider text-slate-800 break-inside-avoid">
        <div className="flex flex-col justify-end">
          <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }} />
          <div className="border-t-2 border-black pt-2">
            <div className="text-black font-extrabold text-[10px]">PREPARED BY</div>
            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Procurement &amp; Supply Chain Manager</div>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }} />
          <div className="border-t-2 border-black pt-2">
            <div className="text-black font-extrabold text-[10px]">VERIFIED BY</div>
            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Accounts Payable &amp; Vendor Ledger Auditor</div>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }} />
          <div className="border-t-2 border-black pt-2">
            <div className="text-black font-extrabold text-[10px]">AUTHORIZED BY</div>
            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Managing Executive Director &amp; Official Seal</div>
          </div>
        </div>
      </div>

      {/* ── SOFTWARE PROVIDER FOOTER ── */}
      <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-600 font-sans print:border-gray-400 break-inside-avoid">
        <div className="flex items-center gap-2 font-bold">
          <span className="text-black font-black uppercase">{businessName || getBrandConfig().fullName}</span>
        </div>
        <div className="text-[9.5px] text-gray-600 font-mono font-medium text-right">
          Software Solution &amp; Cloud Infrastructure by <b className="text-black font-bold">NHT ENTERPRISES (Noor Horizon Technologies)</b>
          <span className="text-gray-400 mx-1.5">•</span>
          <span>Contact: <b className="text-black font-bold">03128039911</b></span>
        </div>
      </div>
    </>
  );
};

export default PurchaseReportSignatureBlock;
