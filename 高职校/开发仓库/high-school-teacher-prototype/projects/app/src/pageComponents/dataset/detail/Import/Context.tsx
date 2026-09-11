import { useRouter } from 'next/router';
import { type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createContext, useContextSelector } from 'use-context-selector';
import {
  ChunkTriggerConfigTypeEnum,
  DatasetCollectionDataProcessModeEnum,
  ImportDataSourceEnum,
  ParagraphChunkAIModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { useMyStep } from '@fastgpt/web/hooks/useStep';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { TabEnum } from '../NavBar';
import { ChunkSettingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type ImportSourceItemType } from '@/web/core/dataset/type';
import { Prompt_AgentQA } from '@fastgpt/global/core/ai/prompt/agent';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { DataChunkSplitModeEnum } from '@fastgpt/global/core/dataset/constants';
import { chunkAutoChunkSize, getAutoIndexSize } from '@fastgpt/global/core/dataset/training/utils';
import { type CollectionChunkFormType } from '../Form/CollectionChunkForm';
import { useLocalStorageState } from 'ahooks';

export type ImportFormType = {
  customPdfParse: boolean;
  webSelector: string;
} & CollectionChunkFormType;

type DatasetImportContextType = {
  importSource: ImportDataSourceEnum;
  parentId: string | undefined;
  activeStep: number;
  goToNext: () => void;

  processParamsForm: UseFormReturn<ImportFormType, any>;
  sources: ImportSourceItemType[];
  setSources: React.Dispatch<React.SetStateAction<ImportSourceItemType[]>>;
  goToPrevious: () => void;
  MyStep: () => JSX.Element;
};

export const defaultFormData: ImportFormType = {
  customPdfParse: true,

  trainingType: DatasetCollectionDataProcessModeEnum.chunk,

  chunkTriggerType: ChunkTriggerConfigTypeEnum.minSize,
  chunkTriggerMinSize: chunkAutoChunkSize,

  dataEnhanceCollectionName: false,

  imageIndex: false,
  autoIndexes: false,
  indexPrefixTitle: false,

  chunkSettingMode: ChunkSettingModeEnum.auto,
  chunkSplitMode: DataChunkSplitModeEnum.paragraph,
  paragraphChunkAIMode: ParagraphChunkAIModeEnum.forbid,
  paragraphChunkDeep: 5,
  paragraphChunkMinSize: 100,

  chunkSize: chunkAutoChunkSize,
  chunkSplitter: '',
  indexSize: getAutoIndexSize(),

  qaPrompt: Prompt_AgentQA.description,
  webSelector: ''
};

export const DatasetImportContext = createContext<DatasetImportContextType>({
  importSource: ImportDataSourceEnum.fileLocal,
  goToNext: function (): void {
    throw new Error('Function not implemented.');
  },
  activeStep: 0,
  parentId: undefined,

  maxChunkSize: 0,
  minChunkSize: 0,
  sources: [],
  setSources: function (value: SetStateAction<ImportSourceItemType[]>): void {
    throw new Error('Function not implemented.');
  },
  chunkSize: 0,
  chunkOverlapRatio: 0,
  //@ts-ignore
  processParamsForm: undefined,
  autoChunkSize: 0,
  goToPrevious: () => {},
  MyStep: () => <></>
});

const DatasetImportContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    source = ImportDataSourceEnum.fileLocal,
    parentId,
    currentTab
  } = (router.query || {}) as {
    source: ImportDataSourceEnum;
    parentId?: string;
    currentTab?: string;
  };

  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);

  // step
  const modeSteps: Record<ImportDataSourceEnum, { title: string }[]> = {
    [ImportDataSourceEnum.reTraining]: [
      { title: t('dataset:core.dataset.import.Adjust parameters') },
      {
        title: t('dataset:import_data_preview')
      },
      { title: t('dataset:import_confirm') }
    ],
    [ImportDataSourceEnum.fileLocal]: [
      {
        title: t('dataset:import_select_file')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ],
    [ImportDataSourceEnum.fileLink]: [
      {
        title: t('dataset:import_select_link')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ],
    [ImportDataSourceEnum.fileCustom]: [
      {
        title: t('dataset:import_select_file')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ],
    [ImportDataSourceEnum.externalFile]: [
      {
        title: t('dataset:import_select_file')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ],
    [ImportDataSourceEnum.apiDataset]: [
      {
        title: t('dataset:import_select_file')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ],
    [ImportDataSourceEnum.imageDataset]: [
      {
        title: t('dataset:import_select_file')
      },
      {
        title: t('dataset:import_param_setting')
      },
      {
        title: t('dataset:import_data_preview')
      },
      {
        title: t('dataset:import_confirm')
      }
    ]
  };
  const steps = modeSteps[source];
  const { activeStep, goToNext, goToPrevious, MyStep, resetStep } = useMyStep({
    defaultStep: 0,
    steps
  });

  const vectorModel = datasetDetail.vectorModel;

  const [localCustomPdfParse, setLocalCustomPdfParse] = useLocalStorageState(
    'dataset_customPdfParse',
    {
      defaultValue: true
    }
  );
  const processParamsForm = useForm<ImportFormType>({
    defaultValues: (() => ({
      ...defaultFormData,
      customPdfParse: localCustomPdfParse,
      indexSize: getAutoIndexSize(vectorModel)
    }))()
  });
  const customPdfParse = processParamsForm.watch('customPdfParse');
  useEffect(() => {
    setLocalCustomPdfParse(customPdfParse);
  }, [customPdfParse, setLocalCustomPdfParse]);

  const [sources, setSources] = useState<ImportSourceItemType[]>([]);

  // 监听 currentTab 变化，当进入 import 页面时重置所有状态
  const prevCurrentTabRef = useRef(currentTab);
  useEffect(() => {
    if (prevCurrentTabRef.current !== currentTab && currentTab === 'import') {
      // 重置步骤到第一步
      resetStep();
      // 清空 sources
      setSources([]);
      // 重置表单到默认值
      processParamsForm.reset({
        ...defaultFormData,
        customPdfParse: localCustomPdfParse,
        indexSize: getAutoIndexSize(vectorModel)
      });
    }
    prevCurrentTabRef.current = currentTab;
  }, [currentTab, resetStep, setSources, processParamsForm, localCustomPdfParse, vectorModel]);

  const contextValue = {
    importSource: source,
    parentId,
    activeStep,
    goToNext,
    goToPrevious,
    MyStep,

    processParamsForm,
    sources,
    setSources
  };

  return (
    <DatasetImportContext.Provider value={contextValue}>{children}</DatasetImportContext.Provider>
  );
};

export default DatasetImportContextProvider;
