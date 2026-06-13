import { useLang } from '../i18n/strings';

export default function GuessButtons({ onGuess, disabled = false }) {
  const { t } = useLang();
  return (
    <div className="flex gap-3 w-full">
      <button onClick={() => onGuess('taas')} disabled={disabled} className="btn-taas">
        {t('btnHigher')}
      </button>
      <button onClick={() => onGuess('baba')} disabled={disabled} className="btn-baba">
        {t('btnLower')}
      </button>
    </div>
  );
}
