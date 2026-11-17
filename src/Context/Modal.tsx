import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';

interface ModalContextType {
  showModal: (
    content: ReactNode,
    title?: string,
    onSubmit?: (result: boolean) => void,
    maxWidth?: string
  ) => void;
  hideModal: (result?: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [title, setTitle] = useState<string | undefined>();
  const [maxWidth, setMaxWidth] = useState<string>('max-w-xl');
  const [onSubmitCallback, setOnSubmitCallback] = useState<
    ((result: boolean) => void) | null
  >(null);

  const showModal = (
    newContent: ReactNode,
    newTitle?: string,
    onSubmit?: (result: boolean) => void,
    newMaxWidth?: string
  ) => {
    setContent(newContent);
    setTitle(newTitle);
    setMaxWidth(newMaxWidth || 'max-w-xl');
    setOnSubmitCallback(() => onSubmit || null);
    setIsClosing(false);
    setIsOpen(true);
  };

  const hideModal = (result?: boolean) => {
    if (onSubmitCallback) {
      onSubmitCallback(result ?? false);
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setContent(null);
      setTitle(undefined);
      setMaxWidth('max-w-xl');
      setOnSubmitCallback(null);
    }, 200);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {isOpen && (
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''}`}>
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-200 ease-out ${
              isClosing ? 'opacity-0' : 'opacity-50 animate-modal-backdrop'
            }`}
            onClick={() => hideModal(false)} // Close without submission
          ></div>
          <div
            className={`relative bg-white p-6 mt-10 rounded-2xl shadow-2xl z-10 ${maxWidth} w-full dark:bg-black overflow-y-auto max-h-[90vh] transition-all duration-200 ease-out border border-stroke dark:border-strokedark ${
              isClosing ? 'opacity-0 scale-90 translate-y-3' : 'animate-modal-pop'
            }`}
            style={{ transformOrigin: 'center center' }}
          >
            {title && (
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 dark:border-strokedark">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <div
                  onClick={() => hideModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-meta-4 text-black dark:text-white cursor-pointer transition"
                >
                  <IoClose className="text-2xl" />
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">{content}</div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
