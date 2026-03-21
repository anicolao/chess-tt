<script>
  import Square from '$lib/components/Square.svelte';

  const FILE_COORDINATES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const RANK_COORDINATES = ['8', '7', '6', '5', '4', '3', '2', '1'];

  export let rows = [];
  export let onPress = () => {};
  export let palette = null;

  $: boardStyle = [
    palette?.lightSquare ? `--board-light-square: ${palette.lightSquare}` : '',
    palette?.darkSquare ? `--board-dark-square: ${palette.darkSquare}` : ''
  ].filter(Boolean).join('; ');
</script>

<div class="board-shell" style={boardStyle}>
  <div class="coordinate-strip files top" aria-hidden="true">
    {#each FILE_COORDINATES as coordinate}
      <span class="coordinate" data-edge="top">{coordinate}</span>
    {/each}
  </div>
  <div class="coordinate-strip ranks left" aria-hidden="true">
    {#each RANK_COORDINATES as coordinate}
      <span class="coordinate" data-edge="left">{coordinate}</span>
    {/each}
  </div>
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
  <div class="coordinate-strip ranks right" aria-hidden="true">
    {#each RANK_COORDINATES as coordinate}
      <span class="coordinate" data-edge="right">{coordinate}</span>
    {/each}
  </div>
  <div class="coordinate-strip files bottom" aria-hidden="true">
    {#each FILE_COORDINATES as coordinate}
      <span class="coordinate" data-edge="bottom">{coordinate}</span>
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
    --coordinate-inset: 0.85rem;
    padding: 0.85rem;
    border-radius: 1.65rem;
    background:
      radial-gradient(circle at top, rgba(143, 188, 255, 0.14), transparent 42%),
      linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(8, 14, 21, 0.6));
    box-shadow:
      0 1.1rem 2.3rem rgba(0, 0, 0, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .coordinate-strip {
    position: absolute;
    display: grid;
    align-items: center;
    justify-items: center;
    color: rgba(232, 238, 244, 0.72);
    font-size: clamp(0.58rem, 1vmin, 0.76rem);
    font-weight: 700;
    letter-spacing: 0.04em;
    pointer-events: none;
    user-select: none;
  }

  .coordinate-strip.files {
    left: var(--coordinate-inset);
    right: var(--coordinate-inset);
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }

  .coordinate-strip.ranks {
    top: var(--coordinate-inset);
    bottom: var(--coordinate-inset);
    grid-template-rows: repeat(8, minmax(0, 1fr));
  }

  .coordinate-strip.top {
    top: 0.18rem;
  }

  .coordinate-strip.bottom {
    bottom: 0.18rem;
  }

  .coordinate-strip.left {
    left: 0.18rem;
  }

  .coordinate-strip.right {
    right: 0.18rem;
  }

  .coordinate {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    width: min(100%, 86vmin, 52rem);
    border-radius: 1rem;
    overflow: hidden;
  }

  @media (orientation: landscape) {
    .board-shell {
      --coordinate-inset: 0.7rem;
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
