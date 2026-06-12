import { formatValue } from '../utils/formatters';

export default function Card({ item, hidden = false, result }) {
  const { category } = item;
  const value = formatValue(item.value, category.formatter);

  return (
    <article
      data-result={result}
      className="perya-card flex flex-col items-center justify-center gap-1.5 p-6 min-h-52 flex-1 text-center"
    >
      <span className="card-label">{category.label}</span>
      <h2 className="card-name">{item.name}</h2>
      <p className="card-metric">{category.metric}</p>
      <p className={hidden ? 'card-hidden' : 'card-value'}>
        {hidden ? '???' : value}
      </p>
    </article>
  );
}
