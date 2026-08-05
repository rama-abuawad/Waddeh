interface InteractiveArabicProps {
  text: string;
  onWord: (word: string) => void;
  wordHint: string;
}

const arabicWordPattern =
  /[\u0621-\u064a\u066e-\u06d3\u06fa-\u06ff\u0750-\u077f][\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0621-\u064a\u066e-\u06d3\u06fa-\u06ff\u0750-\u077f]*/u;

export default function InteractiveArabic({ text, onWord, wordHint }: InteractiveArabicProps) {
  return (
    <p className="whitespace-pre-wrap text-lg leading-10 text-ink/80">
      {text.split(/(\s+)/u).map((token, index) => {
        const word = token.match(arabicWordPattern)?.[0];
        if (!word) return <span key={`${index}-${token}`}>{token}</span>;

        return (
          <button
            key={`${index}-${token}`}
            type="button"
            className="word-token"
            title={wordHint}
            aria-label={`${wordHint}: ${word}`}
            onClick={() => onWord(word)}
          >
            {token}
          </button>
        );
      })}
    </p>
  );
}
