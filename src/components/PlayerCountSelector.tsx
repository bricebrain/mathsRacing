import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { PLAYER_COUNTS, type PlayerCount } from "../engine/config";
export function PlayerCountSelector({ capacity, occupied, disabled, onChange }: {
  capacity: PlayerCount;
  occupied: number;
  disabled: boolean;
  onChange: (capacity: PlayerCount) => void;
}) {
  return <Box sx={{ my: 2 }}>
    <Typography component="p" sx={{ fontSize: 12, color: "#a0b29e", mb: 1 }}>
      Nombre de joueurs · 2 par défaut
    </Typography>
    <ToggleButtonGroup exclusive fullWidth value={capacity} disabled={disabled}
      aria-label="Nombre de joueurs"
      onChange={(_, value: PlayerCount | null) => { if (value) onChange(value); }}
      sx={{ "& .MuiToggleButton-root": { color: "#b9c7b5", borderColor: "#ffffff25",
        textTransform: "none", fontSize: 12,
        "&.Mui-selected, &.Mui-selected:hover": { color: "#b5ef63", backgroundColor: "#b5ef6318" },
        "&.Mui-disabled": { color: "#91a09f", borderColor: "#ffffff12" } } }}>
      {PLAYER_COUNTS.map((count) => <ToggleButton key={count} value={count} disabled={disabled || count < occupied}>
        {count} joueurs
      </ToggleButton>)}
    </ToggleButtonGroup>
  </Box>;
}
