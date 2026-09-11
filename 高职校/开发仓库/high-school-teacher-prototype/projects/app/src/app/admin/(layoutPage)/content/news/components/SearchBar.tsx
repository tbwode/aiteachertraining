'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, Input, Select, Button, InputGroup, InputRightElement } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { ENewsType, ENewsStatus, ENewsLevel } from '@/types/api/admin/teaching/news';
import DateRangePicker from '@/components/common/DateRangePicker';

interface SearchBarProps {
  onSearch: (params: {
    searchKey?: string;
    newsType?: ENewsType;
    status?: ENewsStatus;
    level?: ENewsLevel;
    createTimeStart?: string;
    createTimeEnd?: string;
    updateTimeStart?: string;
    updateTimeEnd?: string;
    publishTimeStart?: string;
    publishTimeEnd?: string;
  }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const { t } = useTranslation('admin');

  const newsTypeOptions = [
    { label: t('content.news.type.notice'), value: ENewsType.NOTICE },
    { label: t('content.news.type.news'), value: ENewsType.NEWS },
    { label: t('content.news.type.policy'), value: ENewsType.POLICY },
    { label: t('content.news.type.teaching'), value: ENewsType.TEACHING },
    { label: t('content.news.type.exchange'), value: ENewsType.EXCHANGE },
    { label: t('content.news.type.achievement'), value: ENewsType.ACHIEVEMENT },
    { label: t('content.news.type.honor'), value: ENewsType.HONOR }
  ];

  const levelOptions = [
    { label: t('content.news.level.school'), value: ENewsLevel.SCHOOL },
    { label: t('content.news.level.group'), value: ENewsLevel.GROUP }
  ];

  const statusOptions = [
    { label: t('content.news.search.draft'), value: ENewsStatus.DRAFT },
    { label: t('content.news.status.published'), value: ENewsStatus.PUBLISHED },
    { label: t('content.news.status.unpublished'), value: ENewsStatus.UNPUBLISHED }
  ];
  const [searchKey, setSearchKey] = useState('');
  const [newsType, setNewsType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  // 日期筛选
  const [createTimeStart, setCreateTimeStart] = useState('');
  const [createTimeEnd, setCreateTimeEnd] = useState('');
  const [updateTimeStart, setUpdateTimeStart] = useState('');
  const [updateTimeEnd, setUpdateTimeEnd] = useState('');
  const [publishTimeStart, setPublishTimeStart] = useState('');
  const [publishTimeEnd, setPublishTimeEnd] = useState('');

  const handleSearch = () => {
    const params: Parameters<SearchBarProps['onSearch']>[0] = {};

    if (searchKey.trim()) {
      params.searchKey = searchKey.trim();
    }
    if (newsType) {
      params.newsType = parseInt(newsType) as ENewsType;
    }
    if (status) {
      params.status = parseInt(status) as ENewsStatus;
    }
    if (level) {
      params.level = parseInt(level) as ENewsLevel;
    }
    // 日期筛选
    if (createTimeStart) params.createTimeStart = createTimeStart;
    if (createTimeEnd) params.createTimeEnd = createTimeEnd;
    if (updateTimeStart) params.updateTimeStart = updateTimeStart;
    if (updateTimeEnd) params.updateTimeEnd = updateTimeEnd;
    if (publishTimeStart) params.publishTimeStart = publishTimeStart;
    if (publishTimeEnd) params.publishTimeEnd = publishTimeEnd;

    onSearch(params);
  };

  const handleReset = () => {
    setSearchKey('');
    setNewsType('');
    setStatus('');
    setLevel('');
    setCreateTimeStart('');
    setCreateTimeEnd('');
    setUpdateTimeStart('');
    setUpdateTimeEnd('');
    setPublishTimeStart('');
    setPublishTimeEnd('');
    onSearch({});
  };

  return (
    <Flex gap={3} align="center" flexWrap="wrap">
      {/* 第一行筛选 */}
      <Select
        w="140px"
        h="36px"
        placeholder={t('content.news.search.selectType')}
        value={newsType}
        onChange={(e) => setNewsType(e.target.value)}
        bg="#F2F3F5"
        border="none"
        fontSize="14px"
        _focus={{ border: 'none', boxShadow: 'none' }}
      >
        {newsTypeOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Select
        w="140px"
        h="36px"
        placeholder={t('content.news.search.selectStatus')}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        bg="#F2F3F5"
        border="none"
        fontSize="14px"
        _focus={{ border: 'none', boxShadow: 'none' }}
      >
        {statusOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      {/* 创建时间 */}
      <DateRangePicker
        startValue={createTimeStart}
        endValue={createTimeEnd}
        onStartChange={setCreateTimeStart}
        onEndChange={setCreateTimeEnd}
        placeholder={t('content.news.search.createTime')}
      />

      {/* 更新时间 */}
      <DateRangePicker
        startValue={updateTimeStart}
        endValue={updateTimeEnd}
        onStartChange={setUpdateTimeStart}
        onEndChange={setUpdateTimeEnd}
        placeholder={t('content.news.search.updateTime')}
      />

      {/* 发布时间 */}
      <DateRangePicker
        startValue={publishTimeStart}
        endValue={publishTimeEnd}
        onStartChange={setPublishTimeStart}
        onEndChange={setPublishTimeEnd}
        placeholder={t('content.news.search.publishTime')}
      />

      {/* 搜索框 */}
      <InputGroup w="200px">
        <Input
          placeholder={t('content.news.search.placeholder')}
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          h="36px"
          fontSize="14px"
          bg="#F2F3F5"
          border="none"
          _focus={{ border: 'none', boxShadow: 'none' }}
          _hover={{ bg: '#F2F3F5' }}
        />
        <InputRightElement h="36px" cursor="pointer" onClick={handleSearch}>
          <SearchIcon color="gray.400" boxSize={4} />
        </InputRightElement>
      </InputGroup>

      {/* 操作按钮 */}
      <Button
        w="80px"
        h="36px"
        borderRadius="8px"
        bg="#F2F3F5"
        color="#4E5969"
        border="none"
        fontSize="14px"
        _hover={{ bg: '#E5E6EB' }}
        onClick={handleReset}
      >
        {t('content.news.search.reset')}
      </Button>

      <Button
        w="80px"
        h="36px"
        bg="#2D2D2D"
        color="white"
        borderRadius="8px"
        fontSize="14px"
        fontWeight="600"
        _hover={{ bg: '#1F1F1F' }}
        onClick={handleSearch}
      >
        {t('content.news.search.search')}
      </Button>
    </Flex>
  );
}
