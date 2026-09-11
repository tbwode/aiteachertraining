# HeaderLocaleToggle

## Usage

```tsx
import HeaderLocaleToggle from '@/app/components/ui/HeaderLocaleToggle';

<HeaderLocaleToggle
  label={t(localeLabelMap[locale])}
  ariaLabel={t('languageSwitcher.ariaLabel')}
  onClick={handleToggleLocale}
/>
```

用于 admin / teacher 顶栏语言切换按钮，样式与交互统一。
