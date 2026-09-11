import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';

import ChatTest from './ChatTest';
import AppCard from './AppCard';
import EditForm from './EditForm';
import { type AppSimpleEditFormType } from '@fastgpt/global/core/app/type';
import { cardStyles } from '../constants';

import styles from './styles.module.scss';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { type SimpleAppSnapshotType } from './useSnapshots';

const Edit = ({
  appForm,
  setAppForm,
  setPast
}: {
  appForm: AppSimpleEditFormType;
  setAppForm: React.Dispatch<React.SetStateAction<AppSimpleEditFormType>>;
  setPast: (value: React.SetStateAction<SimpleAppSnapshotType[]>) => void;
}) => {
  const { isPc } = useSystem();
  const [renderEdit, setRenderEdit] = useState(true);

  return (
    <Box
      display={['block', 'flex']}
      flex={'1 0 0'}
      h={0}
      mt={[4, 0]}
      borderRadius={'lg'}
      overflowY={['auto', 'unset']}
    >
      {renderEdit && (
        <Box
          // className={styles.EditAppBox}
          // pr={[0, 1]}
          overflowY={'auto'}
          minW={['auto', '580px']}
          flex={'2 0 0'}
          borderRight={'md'}
        >
          {/* <Box {...cardStyles} boxShadow={'2'}>
            <AppCard appForm={appForm} setPast={setPast} />
          </Box> */}

          <EditForm appForm={appForm} setAppForm={setAppForm} />
        </Box>
      )}
      {isPc && (
        <Box flex={'1'} w={0} bg={'white'}>
          <ChatTest appForm={appForm} setRenderEdit={setRenderEdit} />
        </Box>
      )}
    </Box>
  );
};

export default React.memo(Edit);
