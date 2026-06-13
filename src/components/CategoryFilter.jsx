import { useLang } from '../i18n/strings';

export default function CategoryFilter({ categories, enabled, onToggle }) {
  const { t } = useLang();
  const catLabels = t('catLabels');

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onToggle(cat.id)}
          aria-pressed={enabled.has(cat.id)}
          className="booth-sign"
        >
          {catLabels[cat.id] || cat.label}
        </button>
      ))}
    </div>
  );
}
