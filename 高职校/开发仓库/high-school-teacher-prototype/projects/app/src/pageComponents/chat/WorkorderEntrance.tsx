import Button from '@/app/components/ui/Button';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'react-i18next';

function WorkorderEntrance() {
  const { t } = useTranslation();
  const handleClick = () => {
    window.top?.postMessage(
      {
        type: 'workorderRequest'
      },
      '*'
    );
  };

  return (
    <Button variant={'primaryOutline'} w={'100%'} mb={2} onClick={handleClick}>
      {t('common:question_feedback')}
    </Button>
  );
}

export default WorkorderEntrance;
