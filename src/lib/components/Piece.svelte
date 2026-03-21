<script>
  const BLACK_PAWN_SYMBOL = '♟';

  export let symbol = '';
  export let label = '';
  export let color = '';

  $: needsScaleAdjustment = symbol === BLACK_PAWN_SYMBOL;
</script>

<span
  class:black={color === 'b'}
  class:facing-top-player={color === 'b'}
  class:scaled-piece={needsScaleAdjustment}
  class="piece"
  role="img"
  aria-label={label}
  data-facing={color === 'b' ? 'top-player' : 'bottom-player'}
  data-piece-color={color}
  data-piece-style="flat-glyph"
>
  <span class="glyph" aria-hidden="true">{symbol}</span>
</span>

<style>
  .piece {
    display: inline-grid;
    align-items: center;
    justify-content: center;
    width: 82%;
    aspect-ratio: 1;
    touch-action: none;
    transform-origin: center;
    user-select: none;
    --piece-glyph-scale: 1;
    --piece-glyph-offset-y: 2%;
  }

  .glyph {
    display: grid;
    place-items: center;
    font-family:
      'Noto Sans Symbols 2',
      'Segoe UI Symbol',
      'Apple Symbols',
      'Arial Unicode MS',
      'Iowan Old Style',
      Charter,
      Georgia,
      'Times New Roman',
      serif;
    font-size: clamp(2.45rem, 5.8vw, 4.1rem);
    font-weight: 400;
    line-height: 1;
    transform: translateY(var(--piece-glyph-offset-y)) scale(var(--piece-glyph-scale));
    pointer-events: none;
    text-rendering: geometricPrecision;
  }

  .piece .glyph {
    color: #f8f2e1;
    -webkit-text-stroke: 0.06rem #2f2418;
    text-shadow:
      0 0.03rem 0 rgba(255, 255, 255, 0.32),
      0 0.12rem 0.12rem rgba(47, 36, 24, 0.16);
  }

  .piece.black .glyph {
    color: #1a2430;
    -webkit-text-stroke: 0.05rem rgba(246, 236, 209, 0.54);
    text-shadow:
      0 0.03rem 0 rgba(255, 255, 255, 0.14),
      0 0.12rem 0.12rem rgba(7, 11, 17, 0.18);
  }

  .scaled-piece {
    /* The black pawn glyph renders noticeably taller than the other unicode pieces. */
    --piece-glyph-scale: 0.86;
    --piece-glyph-offset-y: 4%;
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      width: 84%;
    }

    .glyph {
      font-size: clamp(2.85rem, 4vw, 4.45rem);
    }
  }
</style>
