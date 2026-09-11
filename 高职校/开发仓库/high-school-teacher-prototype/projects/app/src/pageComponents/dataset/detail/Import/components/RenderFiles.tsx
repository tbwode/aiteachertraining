import React, { useState } from 'react';
import {
  Flex,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Progress,
  IconButton,
  Box,
  HStack
} from '@chakra-ui/react';
import { type ImportSourceItemType } from '@/web/core/dataset/type.d';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'react-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyTag from '@fastgpt/web/components/common/Tag/index';

export const RenderUploadFiles = ({
  files,
  setFiles
}: {
  files: ImportSourceItemType[];
  setFiles: React.Dispatch<React.SetStateAction<ImportSourceItemType[]>>;
}) => {
  const { t } = useTranslation();

  return files.length > 0 ? (
    <>
      <TableContainer mt={5}>
        <Table variant={'simple'} fontSize={'sm'} draggable={false}>
          {/* <Thead draggable={false}>
            <Tr bg={'myGray.100'} mb={2}>
              <Th borderLeftRadius={'md'} borderBottom={'none'} py={4}>
                {t('file:file_name')}
              </Th>
              <Th borderBottom={'none'} py={4}>
                {t('common:core.dataset.import.Upload file progress')}
              </Th>
              <Th borderBottom={'none'} py={4}>
                {t('file:file_size')}
              </Th>
              <Th borderRightRadius={'md'} borderBottom={'none'} py={4}>
                {t('common:Action')}
              </Th>
            </Tr>
          </Thead> */}
          <HStack flexDir={'column'}>
            {files.map((item) => (
              <Flex
                justifyContent={'space-between'}
                alignItems={'center'}
                key={item.id}
                bg={'white'}
                mb={2}
                w={'100%'}
                p={4}
                borderRadius={'md'}
              >
                <Box>
                  <Flex alignItems={'center'}>
                    <MyIcon name={item.icon as any} w={'32px'} mr={2} />
                    <Box>
                      <Box color={'#000'} mb={1}>
                        {item.sourceName}
                      </Box>
                      <Box color={'myGray.500'} fontSize={'xs'}>
                        {item.sourceSize}{' '}
                      </Box>
                    </Box>
                  </Flex>
                </Box>

                <Box>
                  {item.errorMsg ? (
                    <MyTooltip label={item.errorMsg}>
                      <MyTag colorSchema={'red'}>
                        <Box mr={1}>{t('common:Error')}</Box>
                        <MyIcon name={'help'} w={'0.9rem'} color={'red.500'} />
                      </MyTag>
                    </MyTooltip>
                  ) : (
                    item.uploadedFileRate != 100 && (
                      <Flex alignItems={'center'} fontSize={'xs'}>
                        <Progress
                          value={item.uploadedFileRate}
                          h={'6px'}
                          w={'150px'}
                          maxW={'210px'}
                          size="sm"
                          borderRadius={'20px'}
                          colorScheme={'blackAlpha'}
                          bg="myGray.200"
                          hasStripe
                          isAnimated
                          mr={2}
                        />
                        {`${item.uploadedFileRate}%`}
                      </Flex>
                    )
                  )}
                  {!item.isUploading && (
                    <Flex alignItems={'center'} gap={4}>
                      <IconButton
                        variant={'grayDanger'}
                        size={'sm'}
                        bg={'white'}
                        icon={<MyIcon name={'delete'} w={'16px'} />}
                        aria-label={''}
                        onClick={() => {
                          setFiles((state) => state.filter((file) => file.id !== item.id));
                        }}
                      />
                    </Flex>
                  )}
                </Box>
              </Flex>
            ))}
          </HStack>
        </Table>
      </TableContainer>
    </>
  ) : null;
};

export default RenderUploadFiles;
