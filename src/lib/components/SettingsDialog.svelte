<script>
  import Controls from '$lib/components/Controls.svelte';
  import {
    BOARD_THEME_PRESETS,
    createDefaultBoardThemeSettings,
    CUSTOM_BOARD_THEME_PRESET_ID
  } from '$lib/game/board-themes';
  import {
    CUSTOM_TIME_CONTROL_PRESET_ID,
    createDefaultTimeSettings,
    getColorName,
    resolveTimeControlPresetId,
    TIME_CONTROL_PRESETS
  } from '$lib/game/time-controls';

  export let corner = 'bottom-right';
  export let invokingSeat = 'bottom';
  export let message = 'White to move';
  export let status = 'active';
  export let winner = null;
  export let resultToken = '*';
  export let capturedWhite = [];
  export let capturedBlack = [];
  export let canUndo = false;
  export let canResign = true;
  export let canExport = false;
  export let boardThemeSettings = null;
  export let timeSettings = null;
  export let seriesHistory = [];
  export let reviewGameNumber = null;
  export let onClose = () => {};
  export let onNewGame = () => {};
  export let onNewSeries = () => {};
  export let onUndo = () => {};
  export let onResign = () => {};
  export let onApplyBoardTheme = () => {};
  export let onApplyTimeControls = () => {};
  export let onExportChessCom = () => {};
  export let onExportLichess = () => {};
  export let onSelectHistoryGame = () => {};

  function cloneComparableTimeSettings(settings) {
    return {
      presetId: settings.presetId,
      seatColors: {
        top: settings.seatColors.top,
        bottom: settings.seatColors.bottom
      },
      seats: {
        top: {
          initialMinutes: settings.seats.top.initialMinutes,
          incrementSeconds: settings.seats.top.incrementSeconds
        },
        bottom: {
          initialMinutes: settings.seats.bottom.initialMinutes,
          incrementSeconds: settings.seats.bottom.incrementSeconds
        }
      }
    };
  }

  function timeSettingsMatch(left, right) {
    return left.presetId === right.presetId &&
      left.seatColors.top === right.seatColors.top &&
      left.seatColors.bottom === right.seatColors.bottom &&
      left.seats.top.initialMinutes === right.seats.top.initialMinutes &&
      left.seats.top.incrementSeconds === right.seats.top.incrementSeconds &&
      left.seats.bottom.initialMinutes === right.seats.bottom.initialMinutes &&
      left.seats.bottom.incrementSeconds === right.seats.bottom.incrementSeconds;
  }

  $: facesTopEdge = corner.startsWith('top');
  const fallbackBoardThemeSettings = createDefaultBoardThemeSettings();
  const fallbackTimeSettings = createDefaultTimeSettings();
  let safeBoardThemeSettings = boardThemeSettings ?? fallbackBoardThemeSettings;
  let safeTimeSettings = timeSettings ?? fallbackTimeSettings;
  $: safeBoardThemeSettings = boardThemeSettings ?? fallbackBoardThemeSettings;
  $: safeTimeSettings = timeSettings ?? fallbackTimeSettings;
  let syncedTimeSettings = cloneComparableTimeSettings(safeTimeSettings);
  let selectedPresetId = safeTimeSettings.presetId ?? fallbackTimeSettings.presetId;
  let customLightSquare = safeBoardThemeSettings.palette.lightSquare;
  let customDarkSquare = safeBoardThemeSettings.palette.darkSquare;
  let showCustomBoardThemeDialog = false;
  let topMinutes = safeTimeSettings.seats.top.initialMinutes;
  let topIncrement = safeTimeSettings.seats.top.incrementSeconds;
  let bottomMinutes = safeTimeSettings.seats.bottom.initialMinutes;
  let bottomIncrement = safeTimeSettings.seats.bottom.incrementSeconds;
  $: topClockLabel = invokingSeat === 'top' ? 'Your Clock' : "Opponent's Clock";
  $: bottomClockLabel = invokingSeat === 'bottom' ? 'Your Clock' : "Opponent's Clock";
  $: completedGames = seriesHistory ?? [];

  $: comparableSafeTimeSettings = cloneComparableTimeSettings(safeTimeSettings);
  $: currentBoardThemePresetId = safeBoardThemeSettings.presetId ?? fallbackBoardThemeSettings.presetId;

  $: if (!timeSettingsMatch(comparableSafeTimeSettings, syncedTimeSettings)) {
    syncedTimeSettings = comparableSafeTimeSettings;
    selectedPresetId = safeTimeSettings.presetId ?? fallbackTimeSettings.presetId;
    topMinutes = safeTimeSettings.seats.top.initialMinutes;
    topIncrement = safeTimeSettings.seats.top.incrementSeconds;
    bottomMinutes = safeTimeSettings.seats.bottom.initialMinutes;
    bottomIncrement = safeTimeSettings.seats.bottom.incrementSeconds;
  }

  $: if (!showCustomBoardThemeDialog) {
    customLightSquare = safeBoardThemeSettings.palette.lightSquare;
    customDarkSquare = safeBoardThemeSettings.palette.darkSquare;
  }

  function handlePresetChange(event) {
    const nextPresetId = event.currentTarget.value;
    selectedPresetId = nextPresetId;

    const preset = TIME_CONTROL_PRESETS.find(({ id }) => id === nextPresetId);
    if (!preset) {
      return;
    }

    topMinutes = preset.seats.top.initialMinutes;
    topIncrement = preset.seats.top.incrementSeconds;
    bottomMinutes = preset.seats.bottom.initialMinutes;
    bottomIncrement = preset.seats.bottom.incrementSeconds;
  }

  function markCustom() {
    selectedPresetId = resolveTimeControlPresetId({
      top: { initialMinutes: topMinutes, incrementSeconds: topIncrement },
      bottom: { initialMinutes: bottomMinutes, incrementSeconds: bottomIncrement }
    });
  }

  function applyTimeControls() {
    onApplyTimeControls({
      presetId: selectedPresetId === CUSTOM_TIME_CONTROL_PRESET_ID ? selectedPresetId : undefined,
      seats: {
        top: {
          initialMinutes: topMinutes,
          incrementSeconds: topIncrement
        },
        bottom: {
          initialMinutes: bottomMinutes,
          incrementSeconds: bottomIncrement
        }
      }
    });
  }

  function applyBoardPreset(preset) {
    showCustomBoardThemeDialog = false;
    onApplyBoardTheme({
      presetId: preset.id,
      palette: {
        lightSquare: preset.lightSquare,
        darkSquare: preset.darkSquare
      }
    });
  }

  function openCustomBoardThemeDialog() {
    customLightSquare = safeBoardThemeSettings.palette.lightSquare;
    customDarkSquare = safeBoardThemeSettings.palette.darkSquare;
    showCustomBoardThemeDialog = true;
  }

  function closeCustomBoardThemeDialog() {
    showCustomBoardThemeDialog = false;
  }

  function applyCustomBoardTheme() {
    onApplyBoardTheme({
      presetId: CUSTOM_BOARD_THEME_PRESET_ID,
      palette: {
        lightSquare: customLightSquare,
        darkSquare: customDarkSquare
      }
    });
    showCustomBoardThemeDialog = false;
  }
</script>

<div
  class:faces-top-edge={facesTopEdge}
  class={`settings-dialog ${corner}`}
  role="dialog"
  aria-label="Game settings"
  data-settings-corner={corner}
>
  <div class="header">
    <div>
      <p class="eyebrow">Game settings</p>
      <h2>{status === 'active' ? 'Table view' : 'Match complete'}</h2>
    </div>
    <button type="button" class="close-button" aria-label="Close settings" on:click={onClose}>✕</button>
  </div>

  <p class="message">{message}</p>
  {#if reviewGameNumber}
    <p class="review-label">Reviewing game {reviewGameNumber}</p>
  {/if}

  <section class="board-theme-section" aria-label="Board colours">
    <div>
      <p class="eyebrow">Board colours</p>
      <p class="time-help">Choose the square colours before adjusting the seat clocks.</p>
    </div>
    <div class="board-theme-row">
      {#each BOARD_THEME_PRESETS as preset}
        <button
          type="button"
          class:selected={currentBoardThemePresetId === preset.id}
          class="board-theme-button"
          aria-label={`${preset.label} board colours`}
          on:click={() => applyBoardPreset(preset)}
        >
          <span class="board-theme-preview" aria-hidden="true">
            <span style={`background:${preset.darkSquare}`}></span>
            <span style={`background:${preset.lightSquare}`}></span>
            <span style={`background:${preset.lightSquare}`}></span>
            <span style={`background:${preset.darkSquare}`}></span>
          </span>
          <span class="board-theme-label">{preset.label}</span>
        </button>
      {/each}
      <button
        type="button"
        class:selected={currentBoardThemePresetId === CUSTOM_BOARD_THEME_PRESET_ID || showCustomBoardThemeDialog}
        class="board-theme-button custom-board-theme-button"
        aria-label="Custom board colours"
        on:click={openCustomBoardThemeDialog}
      >
        <span class="board-theme-preview custom-preview" aria-hidden="true">…</span>
        <span class="board-theme-label">...</span>
      </button>
    </div>
  </section>

  <section class="time-controls" aria-label="Time controls">
    <div class="time-controls-header">
      <div>
        <p class="eyebrow">Time controls</p>
        <p class="time-help">Clocks stay with the table side, not the piece color.</p>
      </div>
      <label class="preset-picker">
        <span>Time control preset</span>
        <select value={selectedPresetId} on:change={handlePresetChange}>
          {#each TIME_CONTROL_PRESETS as preset}
            <option value={preset.id}>{preset.label}</option>
          {/each}
          <option value={CUSTOM_TIME_CONTROL_PRESET_ID}>Custom</option>
        </select>
      </label>
    </div>

    <div class="seat-control-grid">
      <fieldset class="seat-control">
        <legend>{topClockLabel}</legend>
        <p class="seat-color">{getColorName(safeTimeSettings.seatColors.top)} pieces</p>
        <label>
          <span>Minutes</span>
          <input type="number" min="0" max="180" bind:value={topMinutes} on:input={markCustom} />
        </label>
        <label>
          <span>Increment</span>
          <input type="number" min="0" max="120" bind:value={topIncrement} on:input={markCustom} />
        </label>
      </fieldset>

      <fieldset class="seat-control">
        <legend>{bottomClockLabel}</legend>
        <p class="seat-color">{getColorName(safeTimeSettings.seatColors.bottom)} pieces</p>
        <label>
          <span>Minutes</span>
          <input type="number" min="0" max="180" bind:value={bottomMinutes} on:input={markCustom} />
        </label>
        <label>
          <span>Increment</span>
          <input type="number" min="0" max="120" bind:value={bottomIncrement} on:input={markCustom} />
        </label>
      </fieldset>
    </div>

    <button type="button" class="apply-button" on:click={applyTimeControls}>Apply clock settings</button>
  </section>

  <section class="export-controls" aria-label="Export game">
    <div>
      <p class="eyebrow">Export game</p>
      <p class="time-help">Generate a QR code that opens the current game on your phone.</p>
    </div>
    <div class="export-button-grid">
      <button type="button" disabled={!canExport} on:click={onExportChessCom}>Export to Chess.com</button>
      <button type="button" disabled={!canExport} on:click={onExportLichess}>Export to Lichess</button>
    </div>
  </section>

  <section class="series-history" aria-label="Series history">
    <div class="series-header">
      <div>
        <p class="eyebrow">Series history</p>
        <p class="time-help">Completed games stay available for review and export.</p>
      </div>
      <button type="button" class="secondary-button" on:click={onNewSeries}>New Series</button>
    </div>

    {#if completedGames.length === 0}
      <p class="empty-history">No completed games yet.</p>
    {:else}
      <table class="history-table">
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col">White</th>
            <th scope="col">Black</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {#each completedGames as game}
            <tr class:selected={game.gameNumber === reviewGameNumber}>
              <td>
                <button
                  type="button"
                  class="history-link"
                  aria-label={`Review game ${game.gameNumber}: ${game.whiteName} versus ${game.blackName}, ${game.result}`}
                  on:click={() => onSelectHistoryGame(game.gameNumber)}
                >
                  Game {game.gameNumber}
                </button>
              </td>
              <td>{game.whiteName}</td>
              <td>{game.blackName}</td>
              <td class="history-result">{game.result}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <dl class="summary">
    <div>
      <dt>State</dt>
      <dd>{status}</dd>
    </div>
    <div>
      <dt>Winner</dt>
      <dd>{winner ?? '—'}</dd>
    </div>
    <div>
      <dt>Result</dt>
      <dd>{resultToken === '*' ? 'In progress' : resultToken}</dd>
    </div>
  </dl>

  <div class="captures">
    <div>
      <p class="eyebrow">White captured</p>
      <div class="captured-row" aria-label="white captured pieces">
        {#if capturedWhite.length === 0}
          <span class="empty">None</span>
        {:else}
          {#each capturedWhite as piece}
            <span class="captured-piece">{piece.symbol}</span>
          {/each}
        {/if}
      </div>
    </div>

    <div>
      <p class="eyebrow">Black captured</p>
      <div class="captured-row" aria-label="black captured pieces">
        {#if capturedBlack.length === 0}
          <span class="empty">None</span>
        {:else}
          {#each capturedBlack as piece}
            <span class="captured-piece">{piece.symbol}</span>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <Controls
    stacked={true}
    {canUndo}
    {canResign}
    {onNewGame}
    {onUndo}
    {onResign}
  />

  {#if showCustomBoardThemeDialog}
    <div class="dialog-scrim" aria-hidden="true"></div>
    <div class="custom-theme-dialog" role="dialog" aria-label="Custom board colours">
      <div>
        <p class="eyebrow">Custom board colours</p>
        <p class="time-help">Pick the light and dark square colours for this board.</p>
      </div>
      <div class="custom-theme-grid">
        <label class="color-picker">
          <span>Light squares</span>
          <input type="color" bind:value={customLightSquare} />
        </label>
        <label class="color-picker">
          <span>Dark squares</span>
          <input type="color" bind:value={customDarkSquare} />
        </label>
      </div>
      <div class="custom-theme-actions">
        <button type="button" class="secondary-button" on:click={closeCustomBoardThemeDialog}>Cancel</button>
        <button type="button" class="apply-button" on:click={applyCustomBoardTheme}>Apply board colours</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-dialog {
    --dialog-viewport-padding: 2rem;
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 1rem;
    width: min(30rem, calc(100vw - var(--dialog-viewport-padding)));
    max-height: calc(100dvh - var(--dialog-viewport-padding));
    padding: 1.1rem;
    border-radius: 1.2rem;
    background: rgba(10, 16, 23, 0.96);
    box-shadow:
      0 1.2rem 2.2rem rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
    overflow-x: hidden;
    overflow-y: auto;
  }

  .board-theme-section {
    display: grid;
  }

  .board-theme-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .board-theme-button {
    display: grid;
    gap: 0.35rem;
    justify-items: center;
    padding: 0.45rem 0.35rem 0.4rem;
    border: none;
    border-radius: 0.95rem;
    background: rgba(255, 255, 255, 0.04);
    color: #f5f7fa;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .board-theme-button.selected {
    box-shadow:
      inset 0 0 0 0.14rem rgba(142, 225, 255, 0.82),
      0 0.55rem 1rem rgba(0, 0, 0, 0.18);
  }

  .board-theme-preview {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 2.4rem;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 0.55rem;
    box-shadow:
      0 0.45rem 0.8rem rgba(0, 0, 0, 0.18),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .board-theme-preview span {
    display: block;
  }

  .custom-preview {
    place-items: center;
    background: rgba(255, 255, 255, 0.08);
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1;
  }

  .board-theme-label {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .top-left,
  .top-right {
    top: 3rem;
  }

  .bottom-left,
  .bottom-right {
    bottom: 3rem;
  }

  .top-left,
  .bottom-left {
    left: 0;
  }

  .top-right,
  .bottom-right {
    right: 0;
  }

  .faces-top-edge {
    transform: rotate(180deg);
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .close-button {
    width: 2.2rem;
    height: 2.2rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
  }

  .eyebrow,
  .message,
  h2,
  dt,
  dd,
  p,
  legend {
    margin: 0;
  }

  .eyebrow {
    color: #93aabb;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    font-size: 1.05rem;
  }

  .message,
  dd,
  .empty {
    color: #e6edf4;
  }

  .review-label,
  .empty-history {
    color: #8eb7d8;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 0;
  }

  dt {
    color: #93aabb;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  dd {
    margin-top: 0.2rem;
    text-transform: capitalize;
  }

  .captures {
    display: grid;
    gap: 0.75rem;
  }

  .time-controls {
    display: grid;
    gap: 0.75rem;
    padding: 0.9rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .export-controls {
    display: grid;
    gap: 0.75rem;
    padding: 0.9rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .series-history {
    display: grid;
    gap: 0.75rem;
    padding: 0.9rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .time-controls-header {
    display: grid;
    gap: 0.6rem;
  }

  .series-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
  }

  .time-help {
    color: #d6e2eb;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .preset-picker,
  .seat-control label,
  .color-picker {
    display: grid;
    gap: 0.35rem;
  }

  .preset-picker span,
  .seat-control span,
  .color-picker span {
    color: #93aabb;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .preset-picker select,
  .seat-control input {
    min-height: 2.6rem;
    border: none;
    border-radius: 0.85rem;
    padding: 0.65rem 0.85rem;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
  }

  .color-picker input {
    width: 100%;
    min-height: 3rem;
    border: none;
    border-radius: 0.85rem;
    padding: 0.4rem;
    background: rgba(255, 255, 255, 0.08);
  }

  .seat-control-grid {
    display: grid;
    gap: 0.75rem;
  }

  .seat-control {
    display: grid;
    gap: 0.55rem;
    padding: 0.75rem;
    border: 0;
    border-radius: 0.95rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .seat-control legend {
    color: #f5f7fa;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  .seat-color {
    color: #9ab0c0;
    font-size: 0.78rem;
    text-transform: capitalize;
  }

  .apply-button {
    min-height: 3rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(149, 255, 206, 0.86), rgba(79, 188, 255, 0.78));
    color: #08131a;
    font-weight: 700;
  }

  .secondary-button {
    min-height: 3rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
    font-weight: 700;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.86rem;
  }

  .history-table th,
  .history-table td {
    padding: 0.55rem 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6edf4;
    text-align: left;
    vertical-align: middle;
  }

  .history-table th {
    color: #93aabb;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .history-link {
    border: none;
    padding: 0;
    background: none;
    color: #8ee1ff;
    font: inherit;
    font-weight: 700;
    text-align: left;
  }

  .history-result {
    font-weight: 700;
    white-space: nowrap;
  }

  .selected td {
    background: rgba(102, 214, 255, 0.08);
  }

  .export-button-grid {
    display: grid;
    gap: 0.75rem;
  }

  .export-button-grid button {
    min-height: 3rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
    font-weight: 700;
  }

  .export-button-grid button:disabled {
    opacity: 0.46;
  }

  .captured-row {
    display: flex;
    min-height: 1.75rem;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.3rem;
    font-size: 1.2rem;
  }

  .captured-piece {
    filter: drop-shadow(0 0.08rem 0.16rem rgba(0, 0, 0, 0.35));
  }

  .dialog-scrim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(3, 8, 14, 0.7);
    backdrop-filter: blur(4px);
  }

  .custom-theme-dialog {
    position: absolute;
    inset: 1rem;
    z-index: 1;
    display: grid;
    gap: 0.8rem;
    align-content: start;
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(10, 16, 23, 0.98);
    box-shadow:
      0 1.1rem 2rem rgba(0, 0, 0, 0.36),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .custom-theme-grid,
  .custom-theme-actions {
    display: grid;
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    .settings-dialog {
      --dialog-viewport-padding: 1.5rem;
      width: min(22rem, calc(100vw - var(--dialog-viewport-padding)));
    }
  }

  @media (min-width: 640px) {
    .custom-theme-grid,
    .custom-theme-actions,
    .time-controls-header,
    .seat-control-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    .export-button-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .captures {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
