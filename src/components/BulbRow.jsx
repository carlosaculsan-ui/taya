export default function BulbRow({ state = 'idle', count = 30 }) {
  return (
    <div className={`bulb-row${state !== 'idle' ? ` ${state}` : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="bulb" />
      ))}
    </div>
  );
}
