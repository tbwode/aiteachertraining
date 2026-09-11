import { Box, Flex } from '@chakra-ui/react';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import React from 'react';
import styles from '../SimpleApp/styles.module.scss';
import { cardStyles } from '../constants';
import AppCard from './AppCard';
import ChatTest from './ChatTest';
import MyBox from '@fastgpt/web/components/common/MyBox';
import EditForm from './EditForm';
import { type McpToolConfigType } from '@fastgpt/global/core/app/tool/mcpTool/type';
import { type StoreSecretValueType } from '@fastgpt/global/common/secret/type';

const Edit = ({
  url,
  setUrl,
  toolList,
  setToolList,
  currentTool,
  setCurrentTool,
  headerSecret,
  setHeaderSecret
}: {
  url: string;
  setUrl: (url: string) => void;
  toolList: McpToolConfigType[];
  setToolList: (toolList: McpToolConfigType[]) => void;
  currentTool?: McpToolConfigType;
  setCurrentTool: (tool: McpToolConfigType) => void;
  headerSecret: StoreSecretValueType;
  setHeaderSecret: (headerSecret: StoreSecretValueType) => void;
}) => {
  const { isPc } = useSystem();

  return (
    <MyBox
      display={['block', 'flex']}
      flex={'1 0 0'}
      h={0}
      mt={[4, 0]}
      borderRadius={'lg'}
      overflowY={['auto', 'unset']}
    >
      <Flex
        flexDirection={'column'}
        className={styles.EditAppBox}
        minW={['auto', '580px']}
        flex={'1 0 0'}
      >
        {/* <Box {...cardStyles} boxShadow={'2'}>
          <AppCard />
        </Box> */}

        <Box {...cardStyles} flex={'1 0 0'} overflow={'auto'}>
          <EditForm
            toolList={toolList}
            setToolList={setToolList}
            currentTool={currentTool}
            setCurrentTool={setCurrentTool}
            url={url}
            setUrl={setUrl}
            headerSecret={headerSecret}
            setHeaderSecret={setHeaderSecret}
          />
        </Box>
      </Flex>
      {isPc && (
        <Box flex={'2 0 0'} w={0} borderLeft={'md'}>
          <ChatTest currentTool={currentTool} url={url} headerSecret={headerSecret} />
        </Box>
      )}
    </MyBox>
  );
};

export default React.memo(Edit);
