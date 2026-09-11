import { Flex } from '@chakra-ui/react';
import React from 'react';
import Header from './Header';
import Edit from './Edit';
import { workflowBoxStyles } from '../constants';

const HTTPTools = () => {
  return (
    <Flex {...workflowBoxStyles}>
      <Header />
      <Edit />
    </Flex>
  );
};

export default React.memo(HTTPTools);
