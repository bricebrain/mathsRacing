import { Box, Button, Typography } from "@mui/material";
import { isCapital, type ChoiceQuestion } from "../engine/questions";
import type { Correction } from "../shared/protocol";
export function QuestionChoices({ question, active, correction, onChoose }: {
  question: ChoiceQuestion;
  active: boolean;
  correction: Correction | null;
  onChoose: (index: number) => void;
}) {
  const capital = isCapital(question);
  const flag = !capital && question.theme === "flags";
  return (
    <Box className="choice-question" sx={{ my: 1.5 }}>
      {capital ? <>
        <Typography component="p" sx={{ fontSize: 12, color: "#a0b29e", m: 0 }}>
          {question.prompt ?? "Quelle est la capitale de ce pays ?"}
        </Typography>
        <Typography component="h2" sx={{ fontSize: 26, my: 1.5, color: "#f4f6f1" }}>
          {question.country}
        </Typography>
      </> : <>
        <Typography component="h2" sx={{ fontSize: 17, lineHeight: 1.4, my: 1.5, color: "#f4f6f1" }}>
          {question.prompt}
        </Typography>
        {flag && <Box component="img" src={`/flags/${question.entryId.toLowerCase()}.svg`}
          alt="Drapeau à identifier" sx={{ display: "block", width: "100%", height: 78,
            objectFit: "contain", mb: 1.5 }} />}
      </>}
      <Box role="group" aria-label={capital ? `Capitales proposées pour ${question.country}` : "Réponses proposées"}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {question.choices.map((choice, index) => {
          const correct = correction?.choice === index;
          return <Button key={`${question.id}-${index}`} variant="outlined"
            disabled={!active} onClick={() => onChoose(index)}
            aria-label={`${index + 1}. ${choice}`}
            sx={{ minHeight: 52, minWidth: 0, px: 1, textTransform: "none", lineHeight: 1.3,
              overflowWrap: "anywhere", fontSize: 12,
              color: "#e7eee3", borderColor: "#ffffff25", backgroundColor: "#2b3a3e",
              "&:hover": { borderColor: "#b5ef63", backgroundColor: "#384d4d" },
              "&.Mui-disabled": { color: correct ? "#b5ef63" : "#9aa89c",
                borderColor: correct ? "#b5ef63" : "#ffffff12",
                backgroundColor: correct ? "#b5ef6320" : "#2b3a3e" } }}>
            <Box component="span" sx={{ mr: 1, opacity: 0.6 }}>{correct ? "✓" : index + 1}</Box>{choice}
          </Button>;
        })}
      </Box>
    </Box>
  );
}
