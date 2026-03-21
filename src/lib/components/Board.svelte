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
    /* Total space reserved along the short axis for shell padding, page padding, and corner gear clearance. */
    --board-short-axis-offset: 4.5rem;
    /* Combined space reserved along the long axis for both clock rails, page padding, and inter-column gaps.
       32rem covers two 12rem rails plus the tabletop gap/padding budget and the rotated clock overhang needed
       for the paired 1024×768 landscape / 768×1024 portrait parity check to keep the rails fully outside the board. */
    --board-long-axis-offset: 32rem;
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
    width: min(100%, 86vmin, 52rem);
    border-radius: 1rem;
    overflow: hidden;
  }

  @media (orientation: landscape) {
    .board-shell {
      padding: 0.7rem;
    }

    .board {
      width: min(
        calc(100svh - var(--board-short-axis-offset)),
        calc(100vw - var(--board-long-axis-offset)),
        60rem
      );
    }
  }

  @media (orientation: portrait) {
    .board {
      width: min(
        calc(100vw - var(--board-short-axis-offset)),
        calc(100dvh - var(--board-long-axis-offset)),
        60rem
      );
    }
  }
</style>
