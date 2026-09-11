import React, { createContext, useContext, useState } from 'react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getDatasetCollectionById } from '@/web/core/dataset/api';
import type { DatasetCollectionItemType } from '@fastgpt/global/core/dataset/type';
import { useBoolean } from 'ahooks';
import { useRouter } from 'next/router';

type DataCardContextType = {
  collectionId: string;
  collection?: DatasetCollectionItemType;
  reloadCollection: () => Promise<DatasetCollectionItemType>;
  editDataId?: string;
  setEditDataId: React.Dispatch<React.SetStateAction<string | undefined>>;
  isInsertImagesModalOpen: boolean;
  openInsertImagesModal: () => void;
  closeInsertImagesModal: () => void;
};

const DataCardContext = createContext<DataCardContextType>({
  collectionId: '',
  reloadCollection: async () => ({}) as any,
  setEditDataId: () => {},
  isInsertImagesModalOpen: false,
  openInsertImagesModal: () => {},
  closeInsertImagesModal: () => {}
});

export const DataCardContextProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { collectionId = '' } = router.query as { collectionId: string };
  const [editDataId, setEditDataId] = useState<string>();
  const [
    isInsertImagesModalOpen,
    { setTrue: openInsertImagesModal, setFalse: closeInsertImagesModal }
  ] = useBoolean();

  const { data: collection, runAsync: reloadCollection } = useRequest2(
    () => getDatasetCollectionById(collectionId),
    {
      refreshDeps: [collectionId],
      manual: false,
      onError: () => {
        // Handle error or redirect if needed
      }
    }
  );

  return (
    <DataCardContext.Provider
      value={{
        collectionId,
        collection,
        reloadCollection,
        editDataId,
        setEditDataId,
        isInsertImagesModalOpen,
        openInsertImagesModal,
        closeInsertImagesModal
      }}
    >
      {children}
    </DataCardContext.Provider>
  );
};

export const useDataCardContext = () => useContext(DataCardContext);
