import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { GameMode } from "../engine/questions";
export function GameModeSelector({ mode, disabled, onChange }: {
  mode: GameMode;
  disabled: boolean;
  onChange: (mode: GameMode) => void;
}) {
  return (
    <Box sx={{ my: 2 }}>
      <Typography component="p" sx={{ fontSize: 12, color: "#a0b29e", mb: 1 }}>
        Le créateur choisit le mode pour les deux pilotes.
      </Typography>
      <ToggleButtonGroup exclusive fullWidth value={mode} disabled={disabled}
        aria-label="Mode de la course"
        onChange={(_, value: GameMode | null) => { if (value) onChange(value); }}
        sx={{ "& .MuiToggleButton-root": { color: "#b9c7b5", borderColor: "#ffffff25",
          textTransform: "none", fontSize: 12,
          "&.Mui-selected, &.Mui-selected:hover": { color: "#b5ef63", backgroundColor: "#b5ef6318" },
          "&.Mui-disabled": { color: "#91a09f", borderColor: "#ffffff12" } } }}>
        <ToggleButton value="math">Maths</ToggleButton>
        <ToggleButton value="capitals">Capitales d’Europe</ToggleButton>
      </ToggleButtonGroup>
      {mode === "capitals" && (
        <Box sx={{ color: "#a0b29e", fontSize: 11, mt: 1, lineHeight: 1.6 }}>
          51 pays · 4 capitales au choix · Europe au-delà de l’UE.
          <Box component="details" sx={{ mt: 0.5 }}>
            <summary>Pays inclus et difficulté</summary>
            Micro-États, Russie, Turquie, Kazakhstan, Chypre, Arménie, Géorgie et
            Azerbaïdjan inclus. Kosovo inclus, dont la reconnaissance internationale
            est partielle. Territoires dépendants exclus.
            France : très facile (+15 %). Azerbaïdjan : difficile (+75 %).
          </Box>
        </Box>
      )}
    </Box>
  );
}
