<script>
  export let players = {
    top: 'Player 1',
    bottom: 'Player 2'
  };
  export let onClose = () => {};
  export let onStartSeries = () => {};

  let topName = players.top;
  let bottomName = players.bottom;

  $: if (players.top !== topName && !topName.trim()) {
    topName = players.top;
  }

  $: if (players.bottom !== bottomName && !bottomName.trim()) {
    bottomName = players.bottom;
  }

  function startSeries() {
    onStartSeries({
      top: topName,
      bottom: bottomName
    });
  }
</script>

<div class="series-overlay">
  <div class="series-dialog" role="dialog" aria-label="New series">
    <div class="header">
      <div>
        <p class="eyebrow">Series setup</p>
        <h2>New Series</h2>
      </div>
      <button type="button" class="close-button" aria-label="Close new series" on:click={onClose}>✕</button>
    </div>

    <p class="message">
      Enter the player names for each side of the table. The first game will randomly assign White to the
      top or bottom seat, then alternate colours each game in the series.
    </p>

    <div class="player-grid">
      <label>
        <span>Top player name</span>
        <input type="text" bind:value={topName} maxlength="40" />
      </label>
      <label>
        <span>Bottom player name</span>
        <input type="text" bind:value={bottomName} maxlength="40" />
      </label>
    </div>

    <div class="actions">
      <button type="button" class="secondary-button" on:click={onClose}>Cancel</button>
      <button type="button" class="primary-button" on:click={startSeries}>Start series</button>
    </div>
  </div>
</div>

<style>
  .series-overlay {
    position: fixed;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(7, 11, 16, 0.78);
    backdrop-filter: blur(10px);
  }

  .series-dialog {
    display: grid;
    gap: 1rem;
    width: min(28rem, calc(100vw - 2rem));
    padding: 1.2rem;
    border-radius: 1.2rem;
    background: rgba(10, 16, 23, 0.97);
    box-shadow:
      0 1.2rem 2.2rem rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .header,
  .actions {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
  }

  .actions {
    justify-content: flex-end;
  }

  .eyebrow,
  h2,
  .message {
    margin: 0;
  }

  .eyebrow {
    color: #8eb7d8;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .message {
    color: #d8e6f3;
  }

  .player-grid {
    display: grid;
    gap: 0.85rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    color: #d8e6f3;
    font-weight: 600;
  }

  input {
    min-height: 3rem;
    padding: 0.7rem 0.9rem;
    border: none;
    border-radius: 0.95rem;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
    font: inherit;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .close-button,
  .secondary-button,
  .primary-button {
    border: none;
    color: inherit;
    font: inherit;
  }

  .close-button {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
  }

  .secondary-button,
  .primary-button {
    min-height: 3rem;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    font-weight: 700;
  }

  .secondary-button {
    background: rgba(255, 255, 255, 0.08);
  }

  .primary-button {
    background: linear-gradient(135deg, #66d6ff, #4f7bff);
    color: #09121a;
  }
</style>
