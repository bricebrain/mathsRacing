import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { LAP_OPTIONS, type LapCount } from "../engine/config";
export function LapSelector({ laps, disabled, onChange }: {
  laps: LapCount;
  disabled: boolean;
  onChange: (laps: LapCount) => void;
}) {
  return (
    <Box sx={{ my: 2 }}>
      <Typography component="p" sx={{ fontSize: 12, color: "#a0b29e", mb: 1 }}>
        Nombre de tours · 3 par défaut
      </Typography>
      <ToggleButtonGroup exclusive fullWidth value={laps} disabled={disabled}
        aria-label="Nombre de tours"
        onChange={(_, value: LapCount | null) => { if (value) onChange(value); }}
        sx={{ "& .MuiToggleButton-root": { color: "#b9c7b5", borderColor: "#ffffff25",
          textTransform: "none", fontSize: 12,
          "&.Mui-selected, &.Mui-selected:hover": { color: "#b5ef63", backgroundColor: "#b5ef6318" },
          "&.Mui-disabled": { color: "#91a09f", borderColor: "#ffffff12" } } }}>
        {LAP_OPTIONS.map((count) => (
          <ToggleButton key={count} value={count}>{count} tours</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
