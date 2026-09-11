import React from 'react';
import { Flex, Box, type FlexProps } from '@chakra-ui/react';
import MyIcon from '../Icon';
import { useTranslation } from 'react-i18next';
import type { IconNameType } from '../Icon/type';

type Props = FlexProps & {
  text?: string | React.ReactNode;
  iconSize?: string | number;
  iconName?: IconNameType;
};

const EmptyTip = ({ text, iconSize = '48px', iconName, ...props }: Props) => {
  const { t } = useTranslation();
  return (
    <Flex mt={5} flexDirection={'column'} alignItems={'center'} py={'10vh'} {...props}>
      <MyIcon
        name={iconName ? iconName : 'empty'}
        w={iconSize}
        h={iconSize}
        color={'transparent'}
      />
      <Box mt={2} color={'myGray.500'} fontSize={'sm'}>
        {text || t('common:no_more_data')}
      </Box>
    </Flex>
  );
};

export default EmptyTip;
