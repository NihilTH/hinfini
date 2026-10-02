const labels = {
  "Piros": "Red",
  "Fehér": "White",
  "Barna": "Brown",
  "Rózsaszín": "Pink",
  "Sötétlila": "Dark purple",
  "Világoslila": "Light purple",
  "Sötétkék": "Dark blue",
  "Világoskék": "Light blue",
  "Citromsárga": "Yellow",
  "Narancssárga": "Orange",
  "Fekete": "Black",
  "Arany": "Gold",
  "Egyeztetést kérek": "I would like to discuss the options",
  "gyertya": "candle",
  "db": "pcs"
};
export const english = value => labels[value] || value || "";
