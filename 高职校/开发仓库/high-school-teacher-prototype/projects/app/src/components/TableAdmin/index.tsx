'use client';

import type { ComponentProps, Key, ReactNode } from 'react';
import { Box, Flex, Table, Tbody, Td, Th, Thead, Tr, Text } from '@chakra-ui/react';

type TableProps = ComponentProps<typeof Table>;
type TbodyProps = ComponentProps<typeof Tbody>;
type TdProps = ComponentProps<typeof Td>;
type ThProps = ComponentProps<typeof Th>;
type TrProps = ComponentProps<typeof Tr>;

type DataIndex = string | number | readonly (string | number)[];

type ScrollConfig = {
  x?: string | number;
  y?: string | number;
};

export type TableAdminColumn<RecordType extends object> = {
  key?: Key;
  title?: ReactNode;
  dataIndex?: DataIndex;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: RecordType, index: number) => ReactNode;
  onCell?: (record: RecordType, index: number) => TdProps;
  onHeaderCell?: () => ThProps;
};

export type TableAdminProps<RecordType extends object> = {
  columns: TableAdminColumn<RecordType>[];
  dataSource: RecordType[];
  rowKey?: keyof RecordType | ((record: RecordType) => Key);
  loading?: boolean;
  locale?: {
    emptyText?: ReactNode;
    loadingText?: ReactNode;
  };
  scroll?: ScrollConfig;
  tableLayout?: 'auto' | 'fixed';
  headerCellProps?: ThProps;
  bodyCellProps?: TdProps;
  bodyProps?: TbodyProps;
  emptyCellProps?: TdProps;
  rowHoverBg?: string;
  onRow?: (record: RecordType, index: number) => TrProps;
  tableProps?: Omit<TableProps, 'children'>;
  pagination?: false;
};

const getPathValue = (record: object, dataIndex?: DataIndex): unknown => {
  if (dataIndex === undefined) {
    return undefined;
  }

  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];

  return path.reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string | number, unknown>)[segment];
  }, record);
};

const normalizeSize = (size?: string | number): string | undefined => {
  if (size === undefined) {
    return undefined;
  }

  return typeof size === 'number' ? `${size}px` : size;
};

export default function TableAdmin<RecordType extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  locale,
  scroll,
  tableLayout = 'fixed',
  headerCellProps,
  bodyCellProps,
  bodyProps,
  emptyCellProps,
  rowHoverBg = '#FCFCFC',
  onRow,
  tableProps,
  pagination
}: TableAdminProps<RecordType>) {
  // 对齐 antd Table 的 API 习惯：pagination 参数保留但由外层分页器负责渲染。
  void pagination;

  const { sx: tableSx, ...restTableProps } = tableProps ?? {};
  const loadingText = locale?.loadingText ?? '加载中...';
  const emptyText = locale?.emptyText ?? '暂无数据';
  const minWidth = normalizeSize(scroll?.x);
  const maxHeight = normalizeSize(scroll?.y);

  return (
    <Box
      minH="0"
      overflowX={scroll?.x ? 'auto' : undefined}
      overflowY={scroll?.y ? 'auto' : undefined}
      maxH={maxHeight}
      borderRadius="12px"
    >
      <Table
        variant="simple"
        {...restTableProps}
        sx={{
          tableLayout,
          ...(minWidth ? { minWidth } : {}),
          ...tableSx
        }}
      >
        <Thead bg="#FAFAFA">
          <Tr>
            {columns.map((column, index) => {
              const headerCell = column.onHeaderCell?.();
              const key = String(column.key ?? column.dataIndex ?? index);

              return (
                <Th
                  key={key}
                  h="44px"
                  px={5}
                  color="#333"
                  fontSize="14px"
                  fontWeight="500"
                  textTransform="none"
                  {...headerCellProps}
                  {...headerCell}
                  textAlign={column.align ?? headerCell?.textAlign ?? headerCellProps?.textAlign}
                  w={column.width ?? headerCell?.w ?? headerCellProps?.w}
                >
                  {column.title}
                </Th>
              );
            })}
          </Tr>
        </Thead>

        <Tbody {...bodyProps}>
          {loading ? (
            <Tr>
              <Td
                colSpan={Math.max(columns.length, 1)}
                py={16}
                borderColor="blackAlpha.50"
                textAlign="center"
                {...emptyCellProps}
              >
                <Flex justify="center" color="gray.500">
                  <Text fontSize="14px">{loadingText}</Text>
                </Flex>
              </Td>
            </Tr>
          ) : dataSource.length > 0 ? (
            dataSource.map((record, rowIndex) => {
              const rowProps = onRow?.(record, rowIndex);
              const resolvedRowKey =
                typeof rowKey === 'function'
                  ? rowKey(record)
                  : typeof rowKey === 'string'
                    ? (record as Record<string, unknown>)[rowKey]
                    : rowIndex;

              return (
                <Tr
                  key={String(resolvedRowKey ?? rowIndex)}
                  _hover={{ bg: rowHoverBg }}
                  {...rowProps}
                >
                  {columns.map((column, columnIndex) => {
                    const cellValue = getPathValue(record, column.dataIndex);
                    const cellProps = column.onCell?.(record, rowIndex);
                    const content = column.render
                      ? column.render(cellValue, record, rowIndex)
                      : (cellValue as ReactNode);

                    return (
                      <Td
                        key={String(column.key ?? column.dataIndex ?? columnIndex)}
                        px={5}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        color="#4E5969"
                        fontSize="14px"
                        fontWeight="400"
                        {...bodyCellProps}
                        {...cellProps}
                        textAlign={column.align ?? cellProps?.textAlign ?? bodyCellProps?.textAlign}
                      >
                        {content}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })
          ) : (
            <Tr>
              <Td
                colSpan={Math.max(columns.length, 1)}
                py={16}
                borderColor="blackAlpha.50"
                textAlign="center"
                {...emptyCellProps}
              >
                {emptyText}
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
