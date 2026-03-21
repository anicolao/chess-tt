<script>
  const PIECE_IMAGES = {
    wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
  };

  const PIECE_SYMBOLS = {
    wp: '♙',
    wr: '♖',
    wn: '♘',
    wb: '♗',
    wq: '♕',
    wk: '♔',
    bp: '♟',
    br: '♜',
    bn: '♞',
    bb: '♝',
    bq: '♛',
    bk: '♚'
  };

  export let label = '';
  export let color = '';
  export let type = '';
  export let symbol = '';

  let isImageReady = false;
  let hasImageError = false;

  $: pieceKey = color && type ? `${color}${type}` : '';
  $: imageSrc = PIECE_IMAGES[pieceKey] ?? '';
  $: fallbackSymbol = symbol || PIECE_SYMBOLS[pieceKey] || '';
  $: if (pieceKey) {
    isImageReady = false;
    hasImageError = false;
  }
</script>

<span
  class:black={color === 'b'}
  class:facing-top-player={color === 'b'}
  class:scaled-piece={fallbackSymbol === '♟'}
  class="piece"
  role="img"
  aria-label={label}
  data-facing={color === 'b' ? 'top-player' : 'bottom-player'}
  data-piece-color={color}
  data-piece-src={imageSrc}
  data-piece-style="wikimedia-svg"
>
  {#if fallbackSymbol}
    <span
      class:fallback-hidden={isImageReady}
      class="glyph"
      aria-hidden="true"
      data-piece-fallback="unicode"
    >{fallbackSymbol}</span>
  {/if}
  {#if imageSrc && !hasImageError}
    <img
      class:image-ready={isImageReady}
      class="piece-image"
      alt=""
      aria-hidden="true"
      src={imageSrc}
      referrerpolicy="no-referrer"
      draggable="false"
      onload={() => {
        isImageReady = true;
      }}
      onerror={() => {
        hasImageError = true;
        isImageReady = false;
      }}
    />
  {/if}
</span>

<style>
  .piece {
    position: relative;
    display: inline-grid;
    align-items: center;
    justify-content: center;
    width: 80%;
    aspect-ratio: 1;
    touch-action: none;
    transform-origin: center;
    user-select: none;
  }

  .glyph,
  .piece-image {
    position: absolute;
    inset: 0;
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
    transform: translateY(var(--piece-glyph-offset-y, 2%)) scale(var(--piece-glyph-scale, 1));
    text-rendering: geometricPrecision;
    pointer-events: none;
    transition: opacity 120ms ease;
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

  .fallback-hidden {
    opacity: 0;
  }

  .piece-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    -webkit-user-drag: none;
    filter: drop-shadow(0 0.08rem 0.12rem rgba(7, 11, 17, 0.18));
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .image-ready {
    opacity: 1;
  }

  .scaled-piece {
    --piece-glyph-scale: 0.86;
    --piece-glyph-offset-y: 4%;
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      width: 82%;
    }

    .glyph {
      font-size: clamp(2.85rem, 4vw, 4.45rem);
    }
  }
</style>
