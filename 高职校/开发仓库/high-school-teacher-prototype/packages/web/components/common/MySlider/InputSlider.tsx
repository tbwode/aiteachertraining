import React, { useMemo } from 'react';
import { Slider, SliderTrack, SliderThumb, HStack, SliderFilledTrack } from '@chakra-ui/react';
import MyNumberInput from '../Input/NumberInput';

const InputSlider = ({
  onChange,
  value,
  max = 100,
  min = 0,
  step = 1,
  isDisabled
}: {
  value?: number;
  onChange: (index: number) => void;
  max: number;
  min: number;
  step?: number;
  isDisabled?: boolean;
}) => {
  return (
    <HStack zIndex={10} spacing={4} w={'100%'}>
      <Slider
        max={max}
        min={min}
        step={step}
        value={value}
        focusThumbOnChange={false}
        onChange={onChange}
        isDisabled={isDisabled}
      >
        <SliderTrack bg={'myGray.200'} h={'6px'} borderRadius={'6px'}>
          <SliderFilledTrack bg={'myGray.900'} />
        </SliderTrack>
        <SliderThumb
          boxSize={'20px'}
          bg={'white'}
          border={'1px solid'}
          borderColor={'myGray.300'}
          boxShadow={'0px 2px 4px rgba(0, 0, 0, 0.1)'}
          _focusVisible={{ boxShadow: 'none' }}
        />
      </Slider>
      <MyNumberInput
        size={'sm'}
        width={'140px'}
        min={min}
        max={max}
        step={step}
        value={value}
        isDisabled={isDisabled}
        onChange={(e) => onChange(e ?? min)}
      />
    </HStack>
  );
};

export default React.memo(InputSlider);
