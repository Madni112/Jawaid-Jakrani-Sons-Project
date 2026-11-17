import React from 'react';

interface OpeningStockHeaderCardProps {
    isBatchEdit: boolean;
    isEditMode: boolean;
    batchStockNo?: string;
    editStockNo?: string;
    onNavigateList: () => void;
}

export const OpeningStockHeaderCard: React.FC<OpeningStockHeaderCardProps> = ({
    isBatchEdit,
    isEditMode,
    batchStockNo,
    editStockNo,
    onNavigateList
}) => {
    return (
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
            <h3 className="font-medium text-black dark:text-white text-base">
                {isBatchEdit
                    ? `Modify Opening Stock Batch: ${batchStockNo}`
                    : (isEditMode
                        ? `Modify Stock: ${editStockNo}`
                        : 'Initialize Opening Stock (Multi-Item)')}
            </h3>
            <span
                onClick={onNavigateList}
                className="text-sm text-primary font-medium hover:underline cursor-pointer"
            >
                {isBatchEdit || isEditMode ? '← Back to List' : '👁 See List'}
            </span>
        </div>
    );
};

export default OpeningStockHeaderCard;
