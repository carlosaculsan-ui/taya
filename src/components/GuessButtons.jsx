export default function GuessButtons({ onGuess, disabled = false }) {
  return (
    <div className="flex gap-3 w-full">
      <button onClick={() => onGuess('taas')} disabled={disabled} className="btn-taas">
        ▲ Taas
      </button>
      <button onClick={() => onGuess('baba')} disabled={disabled} className="btn-baba">
        ▼ Baba
      </button>
    </div>
  );
}
