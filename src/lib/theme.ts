export const p = {
  bg:        '#F2EBD9',   // aged parchment
  bgCard:    '#FAF5E9',   // cream paper
  bgMap:     '#D8CDBA',   // map background
  bgCta:     '#EDE1C8',   // warm parchment
  border:    '#C8B48A',   // aged ink
  borderMid: '#B09870',   // darker border
  text:      '#1A1209',   // india ink
  textMuted: '#5C4A2A',   // aged brown
  textFaint: '#8B7355',   // faded ink
  amber:     '#C4922A',   // aged gold
  amberDot:  '#8B1A1A',   // burgundy / wax seal
  dotGrid:   '#C8B48A',
}

// Cartographic grid grain — apply as backgroundImage + backgroundSize on page wrappers
export const grain = {
  backgroundImage: [
    'linear-gradient(rgba(139,115,85,0.055) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(139,115,85,0.04) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '28px 28px',
} as const

export const playfair = '"Playfair Display", Georgia, "Times New Roman", serif'
export const crimson  = '"Crimson Text", Georgia, serif'
export const mono     = '"Courier New", Courier, monospace'
