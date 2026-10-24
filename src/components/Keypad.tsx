export function Keypad({
  onKey,
  disabled,
}: {
  onKey: (key: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="keypad" aria-label="Pavé numérique">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"].map(
        (key) => (
          <button
            key={key}
            className={
              key === "OK" ? "key-confirm" : key === "⌫" ? "key-delete" : ""
            }
            aria-label={
              key === "⌫"
                ? "Effacer le dernier chiffre"
                : key === "OK"
                  ? "Valider la réponse"
                  : key
            }
            disabled={disabled}
            onClick={() => onKey(key)}
          >
            {key === "OK" ? (
              <>
                OK <span>↵</span>
              </>
            ) : (
              key
            )}
          </button>
        ),
      )}
    </div>
  );
}
