const COLORS = ['#C8102E', '#FFD100', '#0038A8'];
const FLAG_XS = [22, 67, 112, 157, 200, 243, 288, 333, 378];

// Quadratic bezier y: M 0,8 Q 200,30 400,8 → y = 8 + 44t − 44t²
function stringY(x) {
  const t = x / 400;
  return 8 + 44 * t - 44 * t * t;
}

export default function Banderitas() {
  return (
    <svg
      width="100%"
      height="44"
      viewBox="0 0 400 44"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* drooping string */}
      <path
        d="M 0,8 Q 200,30 400,8"
        stroke="rgba(255,243,176,0.32)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* pennant flags */}
      {FLAG_XS.map((x, i) => {
        const y = stringY(x);
        return (
          <polygon
            key={i}
            points={`${x - 9},${y} ${x + 9},${y} ${x},${y + 16}`}
            fill={COLORS[i % 3]}
            opacity="0.88"
          />
        );
      })}
    </svg>
  );
}
