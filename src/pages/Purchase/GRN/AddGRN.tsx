import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdInventory, MdArrowBack } from 'react-icons/md';
import { getWarehouseAvailableStock } from '../../../utils/stockCalculator';
import { fetchWorkflowSettings } from '../../../service/workflowSettingsService';
import { GRNFormValues, LocationItem, ProductItem, VendorItem } from './types/grnTypes';
import { fetchGRNMetadata, submitGRN } from './services/grnService';
import { catalogHasTileProducts } from '../../../utils/looseUomHelpers';
import { GRNHeaderSection } from './components/GRNHeaderSection';
import { GRNTilesSection } from './components/GRNTilesSection';
import { GRNStandardItemsSection } from './components/GRNStandardItemsSection';
import GRNChallanSection from './components/GRNChallanSection';

const validationSchema = Yup.object().shape({
  grnNo: Yup.string().required('GRN # is mandatory'),
  vendorName: Yup.string().required('Vendor is mandatory'),
  receiptDate: Yup.string().required('Date is mandatory'),
});

const defaultInitialValues: GRNFormValues = {
  grnNo: '',
  vendorName: '',
  receiptDate: new Date().toISOString().split('T')[0],
  gatePasses: {},
  status: 'Confirm',
  remarks: '',
  showTileSection: false,
  tileItems: [],
  items: [{ itemName: '', skuCode: '', qty: 1, uom: 'Nos', warehouseName: '' }],
};

const AddGRN: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prefLoc = searchParams.get('prefLoc');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [initialValues, setInitialValues] = useState<GRNFormValues>(defaultInitialValues);
  const [originalGrn, setOriginalGrn] = useState<any>(null);
  const [stockDataset, setStockDataset] = useState<any>(null);
  const [workflowSettings, setWorkflowSettings] = useState<any>(null);

  const navigate = useNavigate();

  const getLocationStock = (productName: string, warehouseName: string): number => {
    if (!productName || !warehouseName) return 0;
    if (stockDataset) {
      return getWarehouseAvailableStock(productName, warehouseName, stockDataset);
    }
    const p = productList.find((pr) => (pr.product_name || '').toLowerCase() === productName.toLowerCase());
    return Number(p?.current_stock || 0);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setMetadataLoading(true);
        const data = await fetchGRNMetadata(id, prefLoc);
        if (data.stockDataset) setStockDataset(data.stockDataset);
        setVendors(data.vendors || []);
        setProductList(data.productList || data.products || []);
        setLocations(data.locations || []);
        fetchWorkflowSettings().then(setWorkflowSettings).catch(() => {});

        if (id && data.loadedInitialValues) {
          setOriginalGrn(data.originalGrn || data.originalGrnData);
          setInitialValues(data.loadedInitialValues as GRNFormValues);
        } else {
          setInitialValues((prev) => ({
            ...prev,
            grnNo: data.nextGrnNo || data.loadedInitialValues?.grnNo || prev.grnNo,
            items: (prev.items || []).map((it) => ({
              ...it,
              warehouseName: it.warehouseName || data.defaultWhName,
            })),
          }));
        }
      } catch (err: any) {
        toast.error('Failed to load data: ' + (err?.message || 'Unknown error'));
      } finally {
        setMetadataLoading(false);
      }
    };
    load();
  }, [id, prefLoc]);

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl text-black dark:text-bodydark text-xs pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <MdInventory className="text-primary" size={24} />
          {id ? 'Edit Goods Receipt Note (GRN)' : 'Create Goods Receipt Note (GRN)'}
        </h2>
        <button
          onClick={() => navigate('/Purchase/GRN/List')}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <MdArrowBack /> Back to List
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            const isSettingOn = Boolean(workflowSettings?.require_manual_gatepass_purchase);
            const reqLocs = workflowSettings?.manual_gatepass_locations_purchase || [];

            if (isSettingOn) {
              const uniqueReceivingWarehouses = Array.from(new Set([
                ...(values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0).map((i: any) => (i.warehouseName || '').trim()),
                ...(values.showTileSection ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)).map((t: any) => (t.warehouseName || '').trim()) : [])
              ].filter(Boolean)));

              for (const wh of uniqueReceivingWarehouses) {
                if (reqLocs.length === 0 || reqLocs.includes(wh)) {
                  const slip = (values.gatePasses?.[wh] || '').trim();
                  if (!slip) {
                    toast.error(`Please enter Inward Receiving Slip / Gate Pass # for ${wh}!`);
                    return;
                  }
                }
              }
            }

            setLoading(true);
            try {
              const res = await submitGRN(values, locations, id, originalGrn);
              if (res.finalStatus === 'Confirm') {
                toast.success(`GRN ${id ? 'Updated' : 'Confirmed'}! Stock updated instantly.`);
              } else if (res.finalStatus === 'Pending Inward') {
                toast.success(`GRN ${id ? 'Updated' : 'Saved'}! Sent to Warehouse "Inward Challan" for QC Verification.`);
              } else {
                toast.success(`GRN ${id ? 'Updated' : 'Saved'} as Draft.`);
              }
              navigate('/Purchase/GRN/List');
            } catch (err: any) {
              toast.error('Transaction Failed: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, errors, touched, setFieldValue, handleChange }) => {
            const uniqueReceivingWarehouses = Array.from(new Set([
              ...(values.items || []).filter((i: any) => i.itemName && Number(i.qty || 0) > 0).map((i: any) => (i.warehouseName || '').trim()),
              ...(values.showTileSection ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0)).map((t: any) => (t.warehouseName || '').trim()) : [])
            ].filter(Boolean)));

            const isSettingOn = Boolean(workflowSettings?.require_manual_gatepass_purchase);
            const reqLocs = workflowSettings?.manual_gatepass_locations_purchase || [];

            const activeGatepassWarehouses = uniqueReceivingWarehouses.filter((wh: string) => {
              const hasSavedSlip = Boolean(values.gatePasses?.[wh]?.trim());
              if (hasSavedSlip) return true;
              if (isSettingOn && (reqLocs.length === 0 || reqLocs.includes(wh))) {
                return true;
              }
              return false;
            });

            return (
              <Form className="p-6.5 space-y-6">
                {/* Header section: GRN #, Vendor, Date */}
                <GRNHeaderSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  vendors={vendors}
                  locations={locations}
                  hasTileProducts={catalogHasTileProducts(productList)}
                  workflowSettings={workflowSettings}
                />

                {/* Dedicated Tile Items Dynamic Container */}
                <GRNTilesSection
                  values={values}
                  setFieldValue={setFieldValue}
                  locations={locations}
                  productList={productList}
                  getLocationStock={getLocationStock}
                />

                {/* Standard Items Table */}
                <GRNStandardItemsSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                  locations={locations}
                  productList={productList}
                  getLocationStock={getLocationStock}
                />

                {/* Location-wise Inward Challan / Gate Pass Section */}
                <GRNChallanSection
                  values={values}
                  setFieldValue={setFieldValue}
                  activeGatepassWarehouses={activeGatepassWarehouses}
                  workflowSettings={workflowSettings}
                />

                {/* Remarks */}
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Remarks (Optional):</label>
                  <textarea
                    name="remarks"
                    value={values.remarks}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none focus:border-primary"
                    placeholder="e.g. Received via transport #XYZ"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-4 border-t border-stroke dark:border-strokedark">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white font-bold rounded shadow hover:bg-opacity-90 disabled:bg-gray-400"
                  >
                    {loading ? 'Saving GRN...' : 'Confirm Goods Received'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AddGRN;
