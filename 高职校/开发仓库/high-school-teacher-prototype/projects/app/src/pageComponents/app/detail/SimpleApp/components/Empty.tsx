import { Box } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const Empty = () => {
  const { t } = useTranslation();
  return (
    <Box color={'myGray.500'} fontSize={'base'} py={4} textAlign={'center'}>
      {t('account_model:dashboard_no_data')}
    </Box>
  );
};

export default React.memo(Empty);
