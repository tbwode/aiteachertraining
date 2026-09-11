import { Box, type BoxProps } from '@chakra-ui/react';

export interface SvgIconProps extends Omit<BoxProps, 'as'> {
  src: string;
  alt?: string;
  size?: string | number;
}

export default function SvgIcon({
  src,
  alt = 'icon',
  size = '24px',
  boxSize,
  width,
  height,
  ...props
}: SvgIconProps) {
  const resolvedSize = boxSize ?? size;

  return (
    <Box
      as="img"
      src={src}
      alt={alt}
      display="block"
      boxSize={resolvedSize}
      width={width}
      height={height}
      flexShrink={0}
      {...props}
    />
  );
}
