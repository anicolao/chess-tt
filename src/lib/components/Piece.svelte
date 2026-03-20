<script>
  export let symbol = '';
  export let label = '';
  export let color = '';
</script>

<span
  class:black={color === 'b'}
  class:facing-top-player={color === 'b'}
  class="piece"
  role="img"
  aria-label={label}
  data-facing={color === 'b' ? 'top-player' : 'bottom-player'}
  data-piece-color={color}
>
  <span class="glyph" aria-hidden="true">{symbol}</span>
</span>

<style>
  .piece {
    --piece-border-radius: 1.15rem;
    position: relative;
    display: inline-grid;
    align-items: center;
    justify-content: center;
    width: 78%;
    aspect-ratio: 1;
    border-radius: var(--piece-border-radius);
    background:
      radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.96), rgba(229, 233, 240, 0.88) 58%, rgba(196, 206, 220, 0.94));
    box-shadow:
      0 0.24rem 0.55rem rgba(0, 0, 0, 0.34),
      inset 0 0.08rem 0 rgba(255, 255, 255, 0.88),
      inset 0 -0.16rem 0 rgba(86, 99, 118, 0.24);
    touch-action: none;
    transform-origin: center;
    user-select: none;
  }

  .piece.black {
    background:
      radial-gradient(circle at 35% 30%, rgba(111, 123, 141, 0.98), rgba(52, 62, 78, 0.96) 58%, rgba(20, 26, 37, 0.98));
    box-shadow:
      0 0.24rem 0.55rem rgba(0, 0, 0, 0.42),
      inset 0 0.08rem 0 rgba(185, 198, 215, 0.16),
      inset 0 -0.16rem 0 rgba(0, 0, 0, 0.3);
  }

  .glyph {
    color: #243142;
    font-size: clamp(1.9rem, 4.7vw, 3.3rem);
    line-height: 1;
    transform: translateY(-1%);
    filter: drop-shadow(0 0.08rem 0.08rem rgba(255, 255, 255, 0.3));
  }

  .piece.black .glyph {
    color: #f7f0dc;
    filter: drop-shadow(0 0.08rem 0.08rem rgba(0, 0, 0, 0.34));
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      width: 80%;
    }

    .glyph {
      font-size: clamp(2.2rem, 3.7vw, 3.7rem);
    }
  }
</style>
