import React from 'react';
import {
  MdUploadFile,
  MdCloudUpload,
  MdFileDownload,
} from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';

interface BulkUploadDropzoneProps {
  isRTL: boolean;
  activeTab: 'OTHER' | 'TILES';
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadTileTemplate: () => void;
  handleDownloadOtherTemplate: () => void;
  getUrduText: (text: string) => string;
  analyzing: boolean;
}

export const BulkUploadDropzone: React.FC<BulkUploadDropzoneProps> = ({
  isRTL,
  activeTab,
  fileInputRef,
  handleFileUpload,
  handleDownloadTileTemplate,
  handleDownloadOtherTemplate,
  getUrduText,
  analyzing,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-3xl shadow-sm border border-slate-200 dark:border-strokedark p-8 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto border border-emerald-200 dark:border-emerald-800">
        <MdUploadFile />
      </div>

      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-base font-bold text-black dark:text-white">
          {isRTL
            ? (activeTab === 'TILES' ? 'ٹائل پروڈکٹس کی ایکسل یا CSV فائل اپلوڈ کریں' : 'جنرل پروڈکٹس کی ایکسل یا CSV فائل اپلوڈ کریں')
            : (activeTab === 'TILES' ? 'Upload Tile Products Excel or CSV Sheet' : 'Upload General Products Excel or CSV Sheet')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isRTL
            ? 'اسمارٹ آٹو راؤٹنگ: اگر آپ ایک ہی فائل میں ٹائلز اور دیگر پروڈکٹس دونوں اپلوڈ کریں گے تو سسٹم خودکار طور پر الگ الگ کر دے گا۔'
            : 'Smart auto-routing: If you upload tiles under Other Products (or non-tiles under Tiles), the system will automatically redirect and separate them across both tabs!'}
        </p>
      </div>

      {/* TEMPLATE INFO BOX */}
      <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-meta-4/20 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isRTL ? `ایکسل فائل کے کالمز (${activeTab === 'TILES' ? 'ٹائلز' : 'معیاری'}):` : `Supported Columns in ${activeTab === 'TILES' ? 'Tile' : 'Standard'} Excel:`}
          </span>
          <button
            type="button"
            onClick={activeTab === 'TILES' ? handleDownloadTileTemplate : handleDownloadOtherTemplate}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MdFileDownload className="text-sm" /> {isRTL ? "سیمپل ٹیمپلیٹ ڈاؤنلوڈ کریں" : "Download Sample Template"}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
          {activeTab === 'TILES' ? (
            [
              'Code',
              'Description',
              'Brand',
              'Parent Category',
              'Sub Category',
              'Category',
              'Print',
              'UOM',
              'Pieces Per Box',
              'width',
              'height',
              'Purchase Price (Per Box)',
              'Sale Price (Per Box)',
              'Min',
            ].map((col) => (
              <span
                key={col}
                className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-2.5 py-1 rounded-lg font-mono font-semibold text-slate-700 dark:text-slate-300"
              >
                {isRTL ? getUrduText(col) : col}
              </span>
            ))
          ) : (
            ['CODE', 'DESCRIPTION', 'PARENT CATEGORY', 'SUB CATEGORY', 'CATEGORY', 'BRAND', 'PURCHASE PRICE', 'SALES PRICE', 'UOM', 'MINIMUM'].map((col) => (
              <span
                key={col}
                className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-2.5 py-1 rounded-lg font-mono font-semibold text-slate-700 dark:text-slate-300"
              >
                {isRTL ? getUrduText(col) : col}
              </span>
            ))
          )}
        </div>

        <div className={`text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/50 space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="font-bold flex items-center gap-1">
            <span>⚡</span> {isRTL ? "اسمارٹ آٹو راؤٹنگ اور پروڈکٹ کلاسیفکیشن:" : "Intelligent Auto-Routing & Mixed Lists:"}
          </div>
          <ul className={`list-disc list-inside space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300 ${isRTL ? 'pr-1' : 'pl-1'}`}>
            <li>{isRTL ? <>اگر آپ غلطی سے <strong>ٹائل فائل</strong> دوسرے ٹیب میں اپلوڈ کریں گے تو سسٹم خودکار طور پر درست ٹیب پر بھیج دے گا۔</> : <>If you mistakenly upload a <strong>Tile file</strong> in the Other Products tab, it will automatically redirect to the <strong>Tile Products</strong> tab.</>}</li>
            <li>{isRTL ? <>اگر فائل میں <strong>ٹائلز اور دیگر پروڈکٹس دونوں</strong> ہوں تو دونوں خودکار طور پر الگ الگ ہو جائیں گی۔</> : <>If a file contains <strong>both tiles and other products</strong> (e.g. 5 others & 5 tiles), it automatically places each in its respective tab!</>}</li>
            <li>{isRTL ? <>ڈپلیکیٹ پروٹیکشن: ڈپلیکیٹ تب متحرک ہوتا ہے جب <strong>کوڈ اور نام دونوں ایک جیسے ہوں</strong>۔</> : <>2-Layer Duplicate Protection: Duplicate is triggered only if <strong>both Code AND Description match</strong>.</>}</li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md">
            <MdCloudUpload className="text-base" /> {isRTL ? "ایکسل فائل منتخب کریں (.xlsx, .csv)" : "Browse Excel File (.xlsx, .csv)"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={activeTab === 'TILES' ? handleDownloadTileTemplate : handleDownloadOtherTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-boxdark hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-stroke dark:border-strokedark text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <MdFileDownload className="text-base text-emerald-600" /> {isRTL ? "ٹیمپلیٹ ڈاؤنلوڈ کریں" : "Download Template"}
          </button>
        </div>
      </div>

      {analyzing && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 max-w-sm mx-auto flex items-center justify-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <Spinner />
          <span>Analyzing file and routing categories...</span>
        </div>
      )}
    </div>
  );
};
