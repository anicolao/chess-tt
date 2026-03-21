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
    /* Total vertical space reserved for shell padding, page padding, and corner gear clearance. */
    --landscape-board-height-offset: 4.5rem;
    /* Combined width reserved for both side clock rails, page padding, and inter-column gaps. */
    --landscape-board-width-offset: 28rem;
    /* Combined horizontal space reserved for portrait padding and the player-relative gear buttons. */
    --portrait-board-width-offset: 5rem;
    width: fit-content;
    max-width: 100%;
    padding: 0.85rem;
    border-radius: 1.65rem;
    background:
      radial-gradient(circle at top, rgba(143, 188, 255, 0.14), transparent 42%),
      linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(8, 14, 21, 0.6));
    box-shadow:
      0 1.1rem 2.3rem rgba(0, 0, 0, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    width: min(86vmin, calc(100vw - var(--portrait-board-width-offset)), 52rem);
    border-radius: 1rem;
    overflow: hidden;
  }

  @media (orientation: landscape) {
    .board-shell {
      padding: 0.7rem;
    }

    .board {
      width: min(
        calc(100svh - var(--landscape-board-height-offset)),
        calc(100vw - var(--landscape-board-width-offset)),
        60rem
      );
    }
  }
</style>
