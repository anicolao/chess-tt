<script>
  import Square from '$lib/components/Square.svelte';

  export let rows = [];
  export let onPress = () => {};
</script>

<div class="board-shell">
  <div class="board" role="grid" aria-label="Chess board">
    {#each rows as row, rowIndex}
      {#each row as square, columnIndex}
        <Square
          {...square}
          onPress={onPress}
        />
      {/each}
    {/each}
  </div>
</div>

<style>
  .board-shell {
    padding: 0.9rem;
    border-radius: 1.5rem;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(8, 14, 21, 0.55));
    box-shadow:
      0 1.2rem 2.6rem rgba(0, 0, 0, 0.34),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    width: min(86vmin, 52rem);
    border-radius: 1rem;
    overflow: hidden;
  }

  @media (orientation: landscape) {
    .board-shell {
      padding: 0.75rem;
    }

    .board {
      width: min(70vw, calc(100vh - 10rem), 60rem);
    }
  }
</style>
