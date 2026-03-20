<script>
  export let symbol = '';
  export let label = '';
  export let color = '';
</script>

<span
  class:facing-top-player={color === 'b'}
  class="piece"
  role="img"
  aria-label={label}
  data-facing={color === 'b' ? 'top-player' : 'bottom-player'}
>
  {symbol}
</span>

<style>
  .piece {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1;
    filter: drop-shadow(0 0.12rem 0.2rem rgba(0, 0, 0, 0.4));
    touch-action: none;
    transform: rotate(0deg);
    transform-origin: center;
    user-select: none;
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      font-size: clamp(2.35rem, 4vw, 4rem);
    }
  }
</style>
