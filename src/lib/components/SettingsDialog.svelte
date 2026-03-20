<script>
  import Controls from '$lib/components/Controls.svelte';

  export let corner = 'bottom-right';
  export let message = 'White to move';
  export let status = 'active';
  export let winner = null;
  export let capturedWhite = [];
  export let capturedBlack = [];
  export let canUndo = false;
  export let canResign = true;
  export let onClose = () => {};
  export let onNewGame = () => {};
  export let onUndo = () => {};
  export let onResign = () => {};

  $: facesTopEdge = corner.startsWith('top');
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
  p {
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
</style>
