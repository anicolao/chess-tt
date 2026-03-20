<script>
  export let canUndo = false;
  export let canResign = true;
  export let stacked = false;
  export let onNewGame = () => {};
  export let onUndo = () => {};
  export let onResign = () => {};
</script>

<section class:stacked class="controls" aria-label="Game controls">
  <button type="button" class="primary" on:click={onNewGame}>New Game</button>
  <button type="button" disabled={!canUndo} on:click={onUndo}>Undo</button>
  <button type="button" class="danger" disabled={!canResign} on:click={onResign}>Resign</button>
</section>

<style>
  .controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    width: 100%;
  }

  .controls.stacked {
    grid-template-columns: 1fr;
  }

  button {
    min-height: 3.25rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #f5f7fa;
    font-weight: 700;
    letter-spacing: 0.02em;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  button:disabled {
    opacity: 0.46;
  }

  .primary {
    background: linear-gradient(135deg, #66d6ff, #4f7bff);
    color: #09121a;
  }

  .danger {
    background: linear-gradient(135deg, rgba(255, 113, 143, 0.78), rgba(214, 59, 98, 0.72));
  }
</style>
