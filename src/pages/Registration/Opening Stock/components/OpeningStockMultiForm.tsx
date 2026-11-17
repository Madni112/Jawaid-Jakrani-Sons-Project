import React from 'react';
import { Formik, Form } from 'formik';
import Spinner from '../../../../ui/Spinner';
import { OpeningStockMultiFormValues } from '../types/openingStockTypes';
import OpeningStockBatchHeader from './OpeningStockBatchHeader';
import OpeningStockBatchTable from './OpeningStockBatchTable';

interface OpeningStockMultiFormProps {
    initialValues: OpeningStockMultiFormValues;
    validationSchema: any;
    onSubmit: (values: any) => Promise<void>;
    submitPrefix: string;
    loading: boolean;
    locations: any[];
    products: any[];
    stockMap: Record<string, number>;
    showExpiryColumn: boolean;
    setShowExpiryColumn: React.Dispatch<React.SetStateAction<boolean>>;
    openProductRow: number | null;
    setOpenProductRow: React.Dispatch<React.SetStateAction<number | null>>;
    highlightedProductIndex: number;
    setHighlightedProductIndex: React.Dispatch<React.SetStateAction<number>>;
    productInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    productDropdownScrollRef: React.RefObject<HTMLDivElement>;
    navigate: (path: string) => void;
    queueProductScroll: (next: number) => void;
}

export const OpeningStockMultiForm: React.FC<OpeningStockMultiFormProps> = ({
    initialValues,
    validationSchema,
    onSubmit,
    submitPrefix,
    loading,
    locations,
    products,
    stockMap,
    showExpiryColumn,
    setShowExpiryColumn,
    openProductRow,
    setOpenProductRow,
    highlightedProductIndex,
    setHighlightedProductIndex,
    productInputRefs,
    productDropdownScrollRef,
    navigate,
    queueProductScroll
}) => {
    return (
        <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ values, setFieldValue, handleChange, errors, touched }) => {
                return (
                    <Form className="p-6.5 space-y-6">
                        {/* Shared batch header */}
                        <OpeningStockBatchHeader
                            locations={locations}
                            values={values}
                            handleChange={handleChange}
                            errors={errors}
                            touched={touched}
                        />

                        {/* Line items table */}
                        <OpeningStockBatchTable
                            values={values}
                            errors={errors}
                            touched={touched}
                            products={products}
                            stockMap={stockMap}
                            showExpiryColumn={showExpiryColumn}
                            setShowExpiryColumn={setShowExpiryColumn}
                            openProductRow={openProductRow}
                            setOpenProductRow={setOpenProductRow}
                            highlightedProductIndex={highlightedProductIndex}
                            setHighlightedProductIndex={setHighlightedProductIndex}
                            productInputRefs={productInputRefs}
                            productDropdownScrollRef={productDropdownScrollRef}
                            setFieldValue={setFieldValue}
                            handleChange={handleChange}
                            queueProductScroll={queueProductScroll}
                        />

                        {typeof errors.items === 'string' && (
                            <p className="text-red-500 text-xs font-semibold">{String(errors.items)}</p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-stroke dark:border-strokedark">
                            <button
                                type="button"
                                onClick={() => navigate('/Inventory/OpeningStock/List')}
                                className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                            >
                                {loading ? (
                                    <Spinner color="border-white" size="w-4 h-4" />
                                ) : (
                                    `${submitPrefix || 'Save'} ${values.items.length || 1} Opening Stock Item${(values.items?.length || 1) > 1 ? 's' : ''}`
                                )}
                            </button>
                        </div>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default OpeningStockMultiForm;
