# Tabletop Time Controls

Verify that seat-based presets and custom time controls can be configured from settings and that the live clocks switch automatically during play.

## Board theme presets and custom colours can be selected from settings

![Board theme presets and custom colours can be selected from settings](./screenshots/000-board-theme-presets.png)

### Verifications
- [x] The board colour presets sit below the dialog heading and stay visually separated from the time controls
- [x] Selecting the green preset updates the live board square colours immediately

## Custom seat times are applied independently

![Custom seat times are applied independently](./screenshots/001-custom-seat-times.png)

### Verifications
- [x] The top seat clock shows the longer custom time
- [x] The bottom seat clock shows the shorter custom time
- [x] The settings dialog exposes player-relative clock labels
- [x] Applying custom board colours keeps the board on the chosen custom palette

## The live clock handoff and settings editing stay stable after move one

![The live clock handoff and settings editing stay stable after move one](./screenshots/002-live-clock-switch.png)

### Verifications
- [x] The moving bottom seat keeps its full time and waits after the opening move
- [x] The top seat becomes active and begins counting down only after White completes move one
- [x] The in-progress top seat minute edit is preserved while the live clock is running
- [x] The selected custom board colours persist after a move is played

