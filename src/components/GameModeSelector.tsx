import { Box, Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { THEME_IDS, THEME_LABELS, type Theme } from "../constants/themes";
export function GameModeSelector({ themes, disabled, onChange }: {
  themes: Theme[];
  disabled: boolean;
  onChange: (theme: Theme, selected: boolean) => void;
}) {
  return (
    <Box sx={{ my: 2 }}>
      <FormGroup aria-label="Thèmes de la course">
        {THEME_IDS.map((theme) => <FormControlLabel key={theme}
          label={THEME_LABELS[theme]}
          sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 13, color: "#dbe7d4" },
            "& .MuiFormControlLabel-label.Mui-disabled": { color: "#91a09f" } }}
          control={<Checkbox checked={themes.includes(theme)}
            disabled={disabled || (themes.length === 1 && themes[0] === theme)}
            onChange={(_, checked) => onChange(theme, checked)}
            sx={{ color: "#91a09f", p: 0.75, "&.Mui-checked": { color: "#b5ef63" },
              "&.Mui-disabled": { color: "#6f8979" } }} />}
        />)}
      </FormGroup>
      {themes.some((theme) => theme !== "math") && <Box component="details"
        sx={{ color: "#a0b29e", fontSize: 11, mt: 1, lineHeight: 1.6 }}>
        <summary>Sources</summary>
        <Box component="p" sx={{ mb: 0 }}>
          <a href="/data/world-countries.json" target="_blank" rel="noreferrer">Catalogue des pays</a>
          {" · "}<a href="/data/ODbL.txt" target="_blank" rel="noreferrer">Licence ODbL</a>
          {" · "}<a href="https://github.com/hampusborgos/country-flags" target="_blank" rel="noreferrer">Source des drapeaux</a>
        </Box>
      </Box>}
    </Box>
  );
}
