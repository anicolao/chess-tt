<script>
  import Controls from '$lib/components/Controls.svelte';
  import {
    CUSTOM_TIME_CONTROL_PRESET_ID,
    createDefaultTimeSettings,
    getColorName,
    getSeatLabel,
    resolveTimeControlPresetId,
    TIME_CONTROL_PRESETS
  } from '$lib/game/time-controls';

  export let corner = 'bottom-right';
  export let message = 'White to move';
  export let status = 'active';
  export let winner = null;
  export let capturedWhite = [];
  export let capturedBlack = [];
  export let canUndo = false;
  export let canResign = true;
  export let timeSettings = null;
  export let onClose = () => {};
  export let onNewGame = () => {};
  export let onUndo = () => {};
  export let onResign = () => {};
  export let onApplyTimeControls = () => {};

  function getTimeSettingsSignature(settings) {
    return [
      settings.presetId,
      settings.seatColors.top,
      settings.seatColors.bottom,
      settings.seats.top.initialMinutes,
      settings.seats.top.incrementSeconds,
      settings.seats.bottom.initialMinutes,
      settings.seats.bottom.incrementSeconds
    ].join('|');
  }

  $: facesTopEdge = corner.startsWith('top');
  const fallbackTimeSettings = createDefaultTimeSettings();
  let safeTimeSettings = timeSettings ?? fallbackTimeSettings;
  $: safeTimeSettings = timeSettings ?? fallbackTimeSettings;
  let syncedTimeSettingsSignature = getTimeSettingsSignature(safeTimeSettings);
  let selectedPresetId = safeTimeSettings.presetId ?? TIME_CONTROL_PRESETS[0].id;
  let topMinutes = safeTimeSettings.seats.top.initialMinutes;
  let topIncrement = safeTimeSettings.seats.top.incrementSeconds;
  let bottomMinutes = safeTimeSettings.seats.bottom.initialMinutes;
  let bottomIncrement = safeTimeSettings.seats.bottom.incrementSeconds;

  $: safeTimeSettingsSignature = getTimeSettingsSignature(safeTimeSettings);

  $: if (safeTimeSettingsSignature !== syncedTimeSettingsSignature) {
    syncedTimeSettingsSignature = safeTimeSettingsSignature;
    selectedPresetId = safeTimeSettings.presetId ?? TIME_CONTROL_PRESETS[0].id;
    topMinutes = safeTimeSettings.seats.top.initialMinutes;
    topIncrement = safeTimeSettings.seats.top.incrementSeconds;
    bottomMinutes = safeTimeSettings.seats.bottom.initialMinutes;
    bottomIncrement = safeTimeSettings.seats.bottom.incrementSeconds;
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
        <legend>{getSeatLabel('top')}</legend>
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
        <legend>{getSeatLabel('bottom')}</legend>
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

  <dl class="summary">
    <div>
      <dt>State</dt>
      <dd>{status}</dd>
    </div>
    <div>
      <dt>Winner</dt>
      <dd>{winner ?? '—'}</dd>
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
</div>

<style>
  .settings-dialog {
    --dialog-viewport-padding: 2rem;
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 0.9rem;
    width: min(18rem, calc(100vw - var(--dialog-viewport-padding)));
    padding: 1rem;
    border-radius: 1.2rem;
    background: rgba(10, 16, 23, 0.96);
    box-shadow:
      0 1.2rem 2.2rem rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
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

  .summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .time-controls-header {
    display: grid;
    gap: 0.6rem;
  }

  .time-help {
    color: #d6e2eb;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .preset-picker,
  .seat-control label {
    display: grid;
    gap: 0.35rem;
  }

  .preset-picker span,
  .seat-control span {
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

  @media (max-width: 640px) {
    .settings-dialog {
      --dialog-viewport-padding: 1.5rem;
      width: min(16rem, calc(100vw - var(--dialog-viewport-padding)));
    }
  }

  @media (min-width: 640px) {
    .time-controls-header,
    .seat-control-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
</style>
