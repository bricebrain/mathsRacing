import { Box, Button, Typography } from "@mui/material";
import type { CapitalQuestion } from "../engine/capitals";
export function CapitalChoices({ question, active, onChoose }: {
  question: CapitalQuestion;
  active: boolean;
  onChoose: (index: number) => void;
}) {
  return (
    <Box sx={{ my: 2 }}>
      <Typography component="p" sx={{ fontSize: 12, color: "#a0b29e" }}>
        Quelle est la capitale de ce pays ?
      </Typography>
      <Typography component="h2" sx={{ fontSize: 26, my: 1.5, color: "#f4f6f1" }}>
        {question.country}
      </Typography>
      <Box role="group" aria-label={`Capitales proposées pour ${question.country}`}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {question.choices.map((choice, index) => (
          <Button key={`${question.id}-${index}`} variant="outlined"
            disabled={!active} onClick={() => onChoose(index)}
            aria-label={`${index + 1}. ${choice}`}
            sx={{ minHeight: 56, minWidth: 0, textTransform: "none", lineHeight: 1.3,
              color: "#e7eee3", borderColor: "#ffffff25", backgroundColor: "#2b3a3e",
              "&:hover": { borderColor: "#b5ef63", backgroundColor: "#384d4d" },
              "&.Mui-disabled": { color: "#9aa89c", borderColor: "#ffffff12" } }}>
            <Box component="span" sx={{ mr: 1, opacity: 0.6 }}>{index + 1}</Box>{choice}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
