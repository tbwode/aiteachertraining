import {
  useRef,
  useState,
  useCallback,
  type RefObject,
  type ReactNode,
  useMemo,
  useEffect
} from 'react';
import type { FlexProps } from '@chakra-ui/react';
import { Flex, Box, type BoxProps } from '@chakra-ui/react';
import MyIcon from '../components/common/Icon';
import type { IconNameType } from '../components/common/Icon/type';
import { useTranslation } from 'react-i18next';
import { useToast } from './useToast';
import { getErrText } from '@fastgpt/global/common/error/utils';
import {
  useBoolean,
  useCreation,
  useMemoizedFn,
  useRequest,
  useScroll,
  useThrottleEffect
} from 'ahooks';

import { type PaginationProps, type PaginationResponse } from '../common/fetch/type';
import MyMenu from '../components/common/MyMenu';
import { useSystem } from './useSystem';
import { useRouter } from 'next/router';

const thresholdVal = 200;

export function usePagination<DataT, ResT = {}>(
  api: (data: PaginationProps<DataT>) => Promise<PaginationResponse<ResT>>,
  {
    defaultPageSize = 10,
    pageSizeOptions: defaultPageSizeOptions,
    params,
    type = 'button',
    onChange,
    refreshDeps,
    scrollLoadType = 'bottom',
    EmptyTip,
    pollingInterval,
    pollingWhenHidden = false,
    storeToQuery = false
  }: {
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    params?: DataT;
    type?: 'button' | 'scroll';
    onChange?: (pageNum: number) => void;
    refreshDeps?: any[];
    throttleWait?: number;
    scrollLoadType?: 'top' | 'bottom';
    EmptyTip?: React.JSX.Element;
    pollingInterval?: number;
    pollingWhenHidden?: boolean;
    storeToQuery?: boolean;
  }
) {
  const router = useRouter();
  let { page = '1' } = router.query as { page: string };
  const numPage = Number(page);

  const { toast } = useToast();
  const { isPc } = useSystem();
  const { t } = useTranslation();

  const [isLoading, { setTrue, setFalse }] = useBoolean(false);
  const [error, setError] = useState<Error | null>(null);

  const [pageNum, setPageNum] = useState(numPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const pageSizeOptions = useCreation(
    () => defaultPageSizeOptions || [10, 20, 50, 100],
    [defaultPageSizeOptions]
  );

  const [total, setTotal] = useState(0);
  const [data, setData] = useState<ResT[]>([]);
  const totalDataLength = useMemo(() => Math.max(total, data.length), [total, data.length]);

  const isEmpty = total === 0 && !isLoading;
  const noMore = data.length > 0 && data.length >= totalDataLength;

  const fetchData = useMemoizedFn(
    async (num: number = pageNum, ScrollContainerRef?: RefObject<HTMLDivElement>) => {
      if (noMore && num !== 1) return;

      setTrue();
      setError(null);

      try {
        const res = await api({
          pageNum: num,
          pageSize,
          ...params
        });

        setPageNum(num);
        if (storeToQuery && num !== pageNum) {
          router.replace({
            pathname: router.pathname,
            query: {
              ...router.query,
              page: num
            }
          });
        }

        res.total !== undefined && setTotal(res.total);

        if (type === 'scroll') {
          if (scrollLoadType === 'top') {
            const prevHeight = ScrollContainerRef?.current?.scrollHeight || 0;
            const prevScrollTop = ScrollContainerRef?.current?.scrollTop || 0;
            // 使用 requestAnimationFrame 来调整滚动位置
            function adjustScrollPosition() {
              requestAnimationFrame(
                ScrollContainerRef?.current
                  ? () => {
                      if (ScrollContainerRef?.current) {
                        const newHeight = ScrollContainerRef.current.scrollHeight;
                        const heightDiff = newHeight - prevHeight;
                        ScrollContainerRef.current.scrollTop = prevScrollTop + heightDiff;
                      }
                    }
                  : adjustScrollPosition
              );
            }

            setData((prevData) => (num === 1 ? res.list : [...res.list, ...prevData]));
            adjustScrollPosition();
          } else {
            setData((prevData) => (num === 1 ? res.list : [...prevData, ...res.list]));
          }
        } else {
          setData(res.list);
        }

        onChange?.(num);
      } catch (error: any) {
        setError(error);
        if (error.code !== 'ERR_CANCELED') {
          toast({
            title: getErrText(error, t('common:core.chat.error.data_error')),
            status: 'error'
          });
        }
      }

      setFalse();
    }
  );

  // Button pagination
  const Pagination = useCallback(() => {
    const maxPage = Math.ceil(totalDataLength / pageSize);

    const IconButton = ({
      icon,
      isDisabled,
      onClick,
      ...props
    }: {
      icon: IconNameType;
      isDisabled?: boolean;
      onClick: () => void;
    } & FlexProps) => {
      isDisabled = isDisabled || isLoading;
      return (
        <Flex
          alignItems={'center'}
          justifyContent={'center'}
          borderRadius={'md'}
          w={'32px'}
          h={'32px'}
          bg={'transparent'}
          {...(isDisabled
            ? {
                opacity: 0.5,
                cursor: 'not-allowed',
                _hover: {}
              }
            : {
                onClick
              })}
          {...props}
        >
          <MyIcon name={icon} w={'10px'} color={'myGray.500'} />
        </Flex>
      );
    };

    const PageNumber = ({ page, isActive }: { page: number; isActive: boolean }) => {
      return (
        <Flex
          alignItems={'center'}
          justifyContent={'center'}
          borderRadius={'md'}
          w={'32px'}
          h={'32px'}
          cursor={'pointer'}
          bg={isActive ? 'myGray.100' : 'transparent'}
          color={isActive ? 'myGray.900' : 'myGray.500'}
          fontWeight={isActive ? 'bold' : 'normal'}
          _hover={{
            bg: 'myGray.100',
            color: 'myGray.900'
          }}
          onClick={() => fetchData(page)}
        >
          {page}
        </Flex>
      );
    };

    // Calculate page range to show
    const getPageRange = () => {
      const delta = 2; // Number of pages to show before and after current page
      const range = [];
      const rangeWithDots = [];

      range.push(1);

      if (pageNum <= 4) {
        // If current page is close to start
        for (let i = 2; i <= Math.min(5, maxPage - 1); i++) {
          range.push(i);
        }
      } else if (pageNum >= maxPage - 3) {
        // If current page is close to end
        for (let i = Math.max(2, maxPage - 4); i < maxPage; i++) {
          range.push(i);
        }
      } else {
        // Middle pages
        for (let i = pageNum - delta; i <= pageNum + delta; i++) {
          if (i > 1 && i < maxPage) {
            range.push(i);
          }
        }
      }

      if (maxPage > 1) {
        range.push(maxPage);
      }

      let l;
      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      return rangeWithDots;
    };

    return (
      <Flex alignItems={'center'} justifyContent={'center'} fontSize={'sm'} userSelect={'none'}>
        {isPc && (
          <Box color={'myGray.600'} mr={4}>
            {t('common:total_num', { num: totalDataLength })}
          </Box>
        )}

        <Flex alignItems={'center'} gap={2}>
          <IconButton
            isDisabled={pageNum === 1}
            icon="common/leftArrowLight"
            onClick={() => fetchData(pageNum - 1)}
          />

          {getPageRange().map((item, index) =>
            typeof item === 'number' ? (
              <PageNumber key={index} page={item} isActive={pageNum === item} />
            ) : (
              <Box key={index} color={'myGray.500'} px={2}>
                ...
              </Box>
            )
          )}

          <IconButton
            isDisabled={pageNum === maxPage}
            icon="common/rightArrow"
            onClick={() => fetchData(pageNum + 1)}
          />
        </Flex>

        {isPc && (
          <MyMenu
            menuList={[
              {
                label: '',
                children: pageSizeOptions.map((item) => ({
                  label: `${item}`,
                  isActive: pageSize === item,
                  onClick: () => setPageSize(item)
                }))
              }
            ]}
            Button={
              <Flex
                alignItems={'center'}
                cursor={'pointer'}
                ml={4}
                px={3}
                py={1.5}
                border={'1px solid'}
                borderColor={'myGray.200'}
                borderRadius={'md'}
                bg={'white'}
                _hover={{ borderColor: 'primary.500' }}
              >
                <Box color={'myGray.600'}>{t('common:page_amount', { amount: pageSize })}</Box>
                <MyIcon ml={2} name={'core/chat/chevronDown'} w={'12px'} color={'myGray.500'} />
              </Flex>
            }
          />
        )}
      </Flex>
    );
  }, [totalDataLength, isPc, pageSize, t, pageNum, pageSizeOptions, isLoading, fetchData]);

  // Scroll pagination
  const DefaultRef = useRef<HTMLDivElement>(null);
  const ScrollData = useMemoizedFn(
    ({
      children,
      ScrollContainerRef,
      ...props
    }: {
      children: ReactNode;
      ScrollContainerRef?: RefObject<HTMLDivElement>;
    } & BoxProps) => {
      const ref = ScrollContainerRef || DefaultRef;
      const loadText = (() => {
        if (isLoading) return t('common:is_requesting');
        if (noMore) return t('common:request_end');
        return t('common:request_more');
      })();

      const scroll = useScroll(ref);

      // Watch scroll position
      useThrottleEffect(
        () => {
          if (!ref?.current || type !== 'scroll' || noMore || isLoading || data.length === 0)
            return;
          const { scrollTop, scrollHeight, clientHeight } = ref.current;

          if (
            (scrollLoadType === 'bottom' &&
              scrollTop + clientHeight >= scrollHeight - thresholdVal) ||
            (scrollLoadType === 'top' && scrollTop < thresholdVal)
          ) {
            fetchData(pageNum + 1, ref);
          }
        },
        [scroll, isLoading],
        { wait: 50 }
      );

      return (
        <Box {...props} ref={ref} overflow={'overlay'}>
          {scrollLoadType === 'top' && total > 0 && isLoading && (
            <Box mt={2} fontSize={'xs'} color={'blackAlpha.500'} textAlign={'center'}>
              {t('common:is_requesting')}
            </Box>
          )}
          {children}
          {scrollLoadType === 'bottom' && !isEmpty && (
            <Box
              mt={2}
              fontSize={'xs'}
              color={'blackAlpha.500'}
              textAlign={'center'}
              cursor={loadText === t('common:request_more') ? 'pointer' : 'default'}
              onClick={() => {
                if (loadText !== t('common:request_more')) return;
                fetchData(pageNum + 1);
              }}
            >
              {loadText}
            </Box>
          )}
          {isEmpty && EmptyTip}
        </Box>
      );
    }
  );

  // Reload data
  const isFirstLoad = useRef(true);
  const { runAsync: refresh } = useRequest(
    async () => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        fetchData(numPage);
        return;
      }

      fetchData(1);
    },
    {
      manual: false,
      refreshDeps,
      throttleWait: 100
    }
  );
  // Page size refresh
  useEffect(() => {
    data.length > 0 && fetchData();
  }, [pageSize]);

  useRequest(
    async () => {
      if (!pollingInterval) return;
      await fetchData(pageNum);
    },
    {
      pollingInterval,
      pollingWhenHidden,
      manual: false,
      refreshDeps: [pollingInterval]
    }
  );

  return {
    pageNum,
    setPageNum,
    pageSize,
    total: totalDataLength,
    data,
    setData,
    isLoading,
    error,
    Pagination,
    ScrollData,
    getData: fetchData,
    refresh
  };
}
