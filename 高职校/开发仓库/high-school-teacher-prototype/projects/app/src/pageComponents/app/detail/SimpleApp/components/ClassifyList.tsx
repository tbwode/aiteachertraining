import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import type { SystemPluginToolTagType } from '@fastgpt/global/core/plugin/type';
import MyIcon from '@fastgpt/web/components/common/Icon';
import React, { useMemo } from 'react';

const ClassifyList = ({
  tags,
  selectedTagIds,
  onTagSelect,
  size = 'base'
}: {
  tags: SystemPluginToolTagType[];
  selectedTagIds: string[];
  onTagSelect: (tagIds: string[]) => void;
  size?: 'base' | 'sm';
}) => {
  const { t, i18n } = useTranslation();

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagSelect(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagSelect([...selectedTagIds, tagId]);
    }
  };

  const tagBaseStyles = useMemo(() => {
    const sizeStyles = {
      base: {
        px: 3,
        py: 1.5,
        fontSize: 'sm'
      },
      sm: {
        px: 4,
        py: '10px',
        fontSize: '14px'
      }
    };

    return {
      ...sizeStyles[size],
      fontWeight: 'medium',
      // color: 'myGray.700',
      // border: '1px solid',
      // borderColor: 'myGray.200',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      cursor: 'pointer'
    };
  }, [size]);

  return (
    <Flex
      flexDirection={'column'}
      alignItems={'center'}
      userSelect={'none'}
      overflowY={'auto'}
      h={'full'}
      pb={1}
      css={{
        '&:hover': {
          overflow: 'auto',
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px',
            visibility: 'visible'
          }
        },
        '&::-webkit-scrollbar': {
          marginTop: '2px',
          height: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0)',
          borderRadius: '3px',
          visibility: 'hidden'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 0, 0, 0.3)'
        }
      }}
    >
      <Flex
        {...tagBaseStyles}
        rounded={'10px'}
        bg={selectedTagIds.length === 0 ? 'rgba(0, 0, 0, 0.04)' : '#fff'}
        // color={selectedTagIds.length === 0 ? 'white' : '#86909C'}
        color="#000"
        onClick={() => onTagSelect([])}
        mb={2}
        w={'full'}
      >
        <MyIcon name="menu/market" w={4} mr={2}></MyIcon>
        {t('common:All')}
      </Flex>
      {/* <Box mx={2} h={'20px'} w={'1px'} bg={'myGray.200'} flexShrink={0} /> */}
      <Box flex={1} w={'full'}>
        <Flex gap={2} flexWrap="nowrap" flexDirection={'column'} w={'full'}>
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.tagId);
            return (
              <Flex
                key={tag.tagId}
                {...tagBaseStyles}
                rounded={'10px'}
                bg={isSelected ? 'rgba(0, 0, 0, 0.04)!important' : '#fff'}
                // color={isSelected ? 'white' : '#000'}
                color="#000"
                onClick={() => toggleTag(tag.tagId)}
                w={'full'}
              >
                <MyIcon name="menu/market" w={4} mr={2}></MyIcon>
                {t(parseI18nString(tag.tagName, i18n.language))}
              </Flex>
            );
          })}
        </Flex>
      </Box>
    </Flex>
  );
};

export default React.memo(ClassifyList);
