export default function CategoryFilter({ categories, enabled, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onToggle(cat.id)}
          aria-pressed={enabled.has(cat.id)}
          className="booth-sign"
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
