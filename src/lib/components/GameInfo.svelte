<script>
  export let color = 'white';
  export let activeTurn = 'w';
  export let message = 'White to move';
  export let capturedPieces = [];
  export let status = 'active';
  export let winner = null;
  export let mirrored = false;
</script>

<section class:mirrored class:active={activeTurn === (color === 'white' ? 'w' : 'b')} class="panel" aria-label={`${color} player information`}>
  <div>
    <p class="eyebrow">{color} side</p>
    <h2>{activeTurn === (color === 'white' ? 'w' : 'b') ? 'Your move' : 'Waiting'}</h2>
    <p class="message">{message}</p>
  </div>
  <div class="meta">
    <div>
      <p class="eyebrow">Captured</p>
      <div class="captured" aria-label={`${color} captured pieces`}>
        {#if capturedPieces.length === 0}
          <span class="empty">None</span>
        {:else}
          {#each capturedPieces as piece}
            <span class="captured-piece">{piece.symbol}</span>
          {/each}
        {/if}
      </div>
    </div>
    <div>
      <p class="eyebrow">State</p>
      <p class="state-label">{status}</p>
      {#if winner}
        <p class="winner-label">Winner: {winner}</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .panel {
    display: grid;
    gap: 1rem;
    padding: 1rem 1.2rem;
    border-radius: 1.25rem;
    background: rgba(11, 18, 26, 0.72);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .panel.active {
    box-shadow:
      inset 0 0 0 1px rgba(102, 214, 255, 0.46),
      0 0 0 0.2rem rgba(102, 214, 255, 0.12);
  }

  .mirrored {
    transform: rotate(180deg);
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.35rem;
  }

  .eyebrow {
    margin-bottom: 0.32rem;
    color: #9cb6c8;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .message,
  .state-label,
  .winner-label,
  .empty {
    color: #dde7ef;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .captured {
    display: flex;
    min-height: 2rem;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 1.5rem;
  }

  .captured-piece {
    filter: drop-shadow(0 0.08rem 0.16rem rgba(0, 0, 0, 0.36));
  }
</style>
