export default function MixingLoader() {
  return (
    <section className="mixing-loader" role="status" aria-live="polite">
      <div className="mixing-stage" aria-hidden="true">
        <svg className="mixing-steam" viewBox="0 0 60 40" fill="none">
          <path d="M20 36 C16 28 24 24 20 16 C17 10 23 6 21 2" />
          <path d="M30 36 C26 28 34 24 30 16 C27 10 33 6 31 2" />
          <path d="M40 36 C36 28 44 24 40 16 C37 10 43 6 41 2" />
        </svg>

        <svg className="mixing-bowl" viewBox="0 0 120 120" fill="none">
          <path
            className="mixing-surface"
            d="M28 58 Q40 52 52 58 T76 58 T92 58"
          />
          <path
            className="mixing-bowl-body"
            d="M22 58 H98 L88 92 Q84 100 74 100 H46 Q36 100 32 92 Z"
          />
          <path className="mixing-foot" d="M50 100 L48 108 H72 L70 100" />

          <g className="mixing-spoon">
            <line x1="60" y1="60" x2="82" y2="30" />
            <ellipse cx="58" cy="63" rx="9" ry="5" transform="rotate(-38 58 63)" />
          </g>
        </svg>
      </div>

      <span className="section-kicker">ON MÉLANGE</span>
      <h1>Tes recettes<br />repassent en cuisine.</h1>
      <p>On combine tes ingrédients autrement pour te proposer de nouvelles idées anti-gaspi.</p>
    </section>
  );
}
