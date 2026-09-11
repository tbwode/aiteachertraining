import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import MyIcon from '../Icon';
import QuestionTip from '../MyTooltip/QuestionTip';
import type { InputTypeConfigItem } from './configs';
import { useTranslation } from 'react-i18next';

const InputTypeSelector = ({
  inputTypeList,
  selectedType,
  onTypeChange
}: {
  inputTypeList: InputTypeConfigItem[][];
  selectedType: string;
  onTypeChange: (type: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection={'column'} gap={4}>
      {inputTypeList.map((group, groupIndex) => {
        return (
          <Box
            key={groupIndex}
            display={'grid'}
            gridTemplateColumns={'repeat(2, 1fr)'}
            gap={3}
            // mt={3}
          >
            {group.map((item) => {
              const isSelected = selectedType === item.value;
              return (
                <Box
                  display={'flex'}
                  key={item.label}
                  border={'1px solid'}
                  borderColor={isSelected ? 'primary.600' : 'myGray.250'}
                  p={5}
                  rounded={'10px'}
                  fontWeight={'medium'}
                  fontSize={'14px'}
                  alignItems={'center'}
                  cursor={'pointer'}
                  // boxShadow={isSelected ? '0px 0px 0px 2.4px rgba(51, 112, 255, 0.15)' : 'none'}
                  _hover={{
                    '& > svg': {
                      color: 'primary.600'
                    },
                    '& > span': {
                      color: 'myGray.900'
                    },
                    borderColor: 'primary.600',
                    boxShadow: '0px 0px 0px 2.4px rgba(51, 112, 255, 0.15)'
                  }}
                  onClick={() => onTypeChange(item.value)}
                >
                  <MyIcon
                    name={item.icon as any}
                    w={4}
                    mr={3}
                    color={isSelected ? 'primary.600' : 'myBlack.pure'}
                  />
                  <Box
                    as="span"
                    color={isSelected ? 'primary.600' : 'myBlack.pure'}
                    whiteSpace="nowrap"
                  >
                    {t(item.label)}
                  </Box>
                  {item.description && <QuestionTip label={t(item.description)} ml={1} />}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Flex>
  );
};

export default InputTypeSelector;
