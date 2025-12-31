**Title: DentalChart SVG Upgrade Plan for AI Cursor**

**Goal**: Improve the visual quality, surface interactivity, and precision of the DentalChart component by subdividing each surface into multiple zones. Enable smoother AI-guided selection and maintain existing logic compatibility.

---

### STEP 1: Define Zone Subdivisions Per Surface

Create a consistent zone layout for each tooth type (molar, premolar, incisor). Sketch or define:

- **Occlusal** (for molars/premolars): ~8-10 zones (cusps, grooves)
- **Buccal/Lingual**: ~6 zones (vertical bands)
- **Mesial/Distal**: 2 zones each (gingival, incisal)

Name each zone with a pattern: `[surface]-[zoneName]`, e.g., `occlusal-cusp1`, `buccal-zone3`

---

### STEP 2: Create Modular SVG Components per Tooth Type

Create React components:
- `ToothMolarSVG.tsx`
- `ToothPremolarSVG.tsx`
- `ToothIncisorSVG.tsx`

Each should:
- Define its SVG layout
- Include `<path>` or `<polygon>` tags with unique `id`
- Accept props: `status`, `onClick`, `hoveredZone`

Example:
```tsx
<path id="occlusal-cusp1" d="..." onClick={() => onClick('occlusal-cusp1')} fill={getColor(status.zones['occlusal-cusp1'])} />
```

---

### STEP 3: Integrate Sub-Zone Logic in `Tooth.tsx`

Replace old single-surface logic with per-zone mapping:

```ts
status: {
  zones: {
    'occlusal-cusp1': 'filling',
    'buccal-zone3': 'sealing'
  }
}
```

Update event handlers:
- `handleZoneClick(toothId, zoneId)`
- `handleZoneHover(toothId, zoneId)`

Replace any `surface` string usage with `zoneId` string.

---

### STEP 4: Update Global State Handling in `DentalChart.tsx`

- Support both `surfaces` and `zones` keys in state
- Use fallback: `status.surfaces["occlusal"] || status.zones["occlusal-cusp1"]`
- Update tools to operate on zones if defined

Example when applying a tool:
```ts
const newStatus = {
  ...toothData[id],
  zones: {
    ...(toothData[id]?.zones || {}),
    [zoneId]: activeTool
  }
};
```

---

### STEP 5: Improve Visual Feedback

In each SVG zone path:
- Add `hover` state:
  ```tsx
  className={clsx('transition-all', isHovered && 'ring-2 ring-blue-400')}
  ```
- Use color fill based on zone state:
  ```tsx
  fill={getColor(status.zones[zoneId])}
  ```
- Optionally animate fill transitions with Tailwind or inline `transition`

---

### STEP 6: Support Zoom or Tooltip Overlay

On hover or long-press:
- Zoom in on tooth
- Or show a tooltip with zone name: `"Occlusal - Cusp 1"`

Use `<Tooltip>` or `<div style={{ position: 'absolute' }}>`

---

### STEP 7: Maintain Compatibility

- Keep existing `surface` logic intact
- New tools should prefer `zones`, fall back to `surfaces`
- During migration, map basic surface to default zone:
  ```ts
  occlusal -> occlusal-cusp1
  buccal -> buccal-zone3
  ```

---

### STEP 8: Optimize for Reuse and Performance

- Use `<use xlinkHref="#molar-template" />` to reuse SVG shapes
- Avoid rerenders by memoizing `ToothSVG` components
- Debounce drag selection by 50ms

---

### STEP 9: Optional: Animate Cursor Feedback

Update `ToolCursor.tsx`:
- Show AI-guided cursor glow or pulse
- Display zone name on hover below cursor
- Example:
```tsx
<div className="absolute top-0 left-0 text-xs bg-white px-1 rounded shadow">{hoveredZoneLabel}</div>
```

---

This guide allows your AI cursor and tools to work precisely with high-resolution zones while preserving existing logic and improving UX.

