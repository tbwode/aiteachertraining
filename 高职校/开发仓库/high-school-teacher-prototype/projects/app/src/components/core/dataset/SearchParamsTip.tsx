import { useSystemStore } from '@/web/common/system/useSystemStore';
import { Flex, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import {
  DatasetSearchModeEnum,
  DatasetSearchModeMap
} from '@fastgpt/global/core/dataset/constants';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useMemo } from 'react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { getWebLLMModel } from '@/web/common/system/utils';

const SearchParamsTip = ({
  searchMode,
  similarity = 0,
  limit = 5000,
  responseEmptyText,
  usingReRank = false,
  usingExtensionQuery,
  queryExtensionModel
}: {
  searchMode: `${DatasetSearchModeEnum}`;
  similarity?: number;
  limit?: number;
  responseEmptyText?: string;
  usingReRank?: boolean;
  usingExtensionQuery?: boolean;
  queryExtensionModel?: string;
}) => {
  const { t } = useTranslation();
  const { reRankModelList } = useSystemStore();

  const hasReRankModel = reRankModelList.length > 0;
  const hasEmptyResponseMode = responseEmptyText !== undefined;
  const hasSimilarityMode = usingReRank || searchMode === DatasetSearchModeEnum.embedding;

  const extensionModelName = useMemo(
    () => (usingExtensionQuery ? getWebLLMModel(queryExtensionModel)?.name : ''),
    [usingExtensionQuery, queryExtensionModel]
  );

  return (
    <TableContainer
      bg={'rgba(232, 243, 255, 0.61)'}
      borderRadius={'lg'}
      // borderWidth={'1px'}
      // borderColor={'#C4E0FF'}
      p={3}
      sx={{
        '&::-webkit-scrollbar': {
          height: '6px',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'myGray.250 !important',
          '&:hover': {
            backgroundColor: 'myGray.300 !important'
          }
        }
      }}
    >
      <Table fontSize={'xs'} overflow={'overlay'}>
        <Thead>
          <Tr bg={'transparent !important'}>
            <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
              {t('common:core.dataset.search.search mode')}
            </Th>
            <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
              {t('common:max_quote_tokens')}
            </Th>
            <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
              {t('common:min_similarity')}
            </Th>
            {hasReRankModel && (
              <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
                {t('common:core.dataset.search.ReRank')}
              </Th>
            )}
            <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
              {t('common:core.module.template.Query extension')}
            </Th>
            {hasEmptyResponseMode && (
              <Th fontSize={'13px'} color={'#000'} textAlign={'center'} border="none!important">
                {t('common:core.dataset.search.Empty result response')}
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody>
          <Tr color={'rgba(0, 0, 0, 0.50)'}>
            <Td pt={0} pb={2} textAlign={'center'}>
              <Flex alignItems={'center'} justifyContent={'center'} fontSize={'13px'}>
                <MyIcon
                  name={DatasetSearchModeMap[searchMode]?.icon as any}
                  w={'12px'}
                  mr={'1px'}
                />
                {t(DatasetSearchModeMap[searchMode]?.title as any)}
              </Flex>
            </Td>
            <Td pt={0} pb={2} textAlign={'center'} fontSize={'13px'}>
              {limit}
            </Td>
            <Td pt={0} pb={2} textAlign={'center'} fontSize={'13px'}>
              {hasSimilarityMode ? similarity : t('common:core.dataset.search.Nonsupport')}
            </Td>
            {hasReRankModel && (
              <Td pt={0} pb={2} textAlign={'center'} fontSize={'13px'} color={'#000'}>
                {usingReRank ? '✅' : '❌'}
              </Td>
            )}
            <Td pt={0} pb={2} fontSize={'13px'} textAlign={'center'}>
              {extensionModelName || '❌'}
            </Td>
            {hasEmptyResponseMode && (
              <Td pt={0} pb={2} fontSize={'13px'} textAlign={'center'} color={'#000'}>
                {responseEmptyText !== '' ? '✅' : '❌'}
              </Td>
            )}
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(SearchParamsTip);
