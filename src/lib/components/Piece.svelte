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
  data-piece-style="engraved-glyph"
>
  <span class="glyph glyph-shadow" aria-hidden="true">{symbol}</span>
  <span class="glyph glyph-outline" aria-hidden="true">{symbol}</span>
  <span class="glyph glyph-fill" aria-hidden="true">{symbol}</span>
</span>

<style>
  .piece {
    position: relative;
    display: inline-grid;
    align-items: center;
    justify-content: center;
    width: 84%;
    aspect-ratio: 1;
    touch-action: none;
    transform-origin: center;
    user-select: none;
  }

  .piece::after {
    content: '';
    position: absolute;
    inset: 56% 18% 8%;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(7, 11, 17, 0.34), transparent 72%);
    filter: blur(0.28rem);
    pointer-events: none;
  }

  .glyph {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: 'Iowan Old Style', Charter, Georgia, 'Times New Roman', serif;
    font-size: clamp(2.6rem, 6vw, 4.3rem);
    font-weight: 700;
    line-height: 1;
    transform: translateY(3%);
    pointer-events: none;
  }

  .glyph-shadow {
    color: rgba(7, 11, 17, 0.28);
    transform: translate(5%, 9%);
  }

  .glyph-outline {
    color: #243142;
    -webkit-text-stroke: 0.12rem #23303f;
    text-shadow:
      0 0.04rem 0 rgba(255, 255, 255, 0.36),
      0 0.16rem 0.28rem rgba(0, 0, 0, 0.2);
  }

  .glyph-fill {
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    background: linear-gradient(180deg, #fffdf5 0%, #efe1bf 46%, #cbb27d 100%);
  }

  .piece.black .glyph-outline {
    color: #f2e7cb;
    -webkit-text-stroke: 0.11rem #d5c7a0;
    text-shadow:
      0 0.04rem 0 rgba(255, 255, 255, 0.12),
      0 0.16rem 0.28rem rgba(0, 0, 0, 0.34);
  }

  .piece.black .glyph-fill {
    background: linear-gradient(180deg, #5f6f84 0%, #2d3746 56%, #121923 100%);
  }

  .facing-top-player {
    transform: rotate(180deg);
  }

  @media (orientation: landscape) {
    .piece {
      width: 86%;
    }

    .glyph {
      font-size: clamp(3rem, 4.2vw, 4.7rem);
    }
  }
</style>
