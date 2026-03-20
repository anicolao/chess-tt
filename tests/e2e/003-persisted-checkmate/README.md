# Persisted Checkmate State

Verify that the event log in local storage restores a completed checkmate position after reload and exposes its controls through the settings panel.

## A Persisted Checkmate Position and Settings View Restore Correctly

![A Persisted Checkmate Position and Settings View Restore Correctly](./screenshots/000-restored-checkmate.png)

### Verifications
- [x] The restored game shows the checkmate message
- [x] The black queen occupies h4 in the restored position
- [x] Resign is disabled because the game is complete
- [x] The settings panel faces the top edge when opened from the top-left corner

