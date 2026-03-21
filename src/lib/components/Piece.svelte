<script>
  import wp from '$lib/assets/pieces/Chess_plt45.svg';
  import wr from '$lib/assets/pieces/Chess_rlt45.svg';
  import wn from '$lib/assets/pieces/Chess_nlt45.svg';
  import wb from '$lib/assets/pieces/Chess_blt45.svg';
  import wq from '$lib/assets/pieces/Chess_qlt45.svg';
  import wk from '$lib/assets/pieces/Chess_klt45.svg';
  import bp from '$lib/assets/pieces/Chess_pdt45.svg';
  import br from '$lib/assets/pieces/Chess_rdt45.svg';
  import bn from '$lib/assets/pieces/Chess_ndt45.svg';
  import bb from '$lib/assets/pieces/Chess_bdt45.svg';
  import bq from '$lib/assets/pieces/Chess_qdt45.svg';
  import bk from '$lib/assets/pieces/Chess_kdt45.svg';

  const PIECE_IMAGES = { wp, wr, wn, wb, wq, wk, bp, br, bn, bb, bq, bk };

  export let label = '';
  export let color = '';
  export let type = '';

  $: pieceKey = color && type ? `${color}${type}` : '';
  $: imageSrc = PIECE_IMAGES[pieceKey] ?? '';
</script>

<span
  class:black={color === 'b'}
  class:facing-top-player={color === 'b'}
  class="piece"
  role="img"
  aria-label={label}
  data-facing={color === 'b' ? 'top-player' : 'bottom-player'}
  data-piece-color={color}
  data-piece-src={imageSrc}
  data-piece-style="wikimedia-svg"
>
  {#if imageSrc}
    <img
      class="piece-image"
      alt=""
      aria-hidden="true"
      src={imageSrc}
      draggable="false"
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

  .piece-image {
    position: absolute;
    inset: 0;
  }

  .piece-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    -webkit-user-drag: none;
    filter: drop-shadow(0 0.08rem 0.12rem rgba(7, 11, 17, 0.18));
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      width: 82%;
    }
  }
</style>
