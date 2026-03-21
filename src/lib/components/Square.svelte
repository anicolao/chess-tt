<script>
  import Piece from '$lib/components/Piece.svelte';

  export let square;
  export let ariaLabel;
  export let symbol;
  export let pieceLabel;
  export let piece;
  export let isLight;
  export let isSelected;
  export let isHighlighted;
  export let isLastMove;
  export let onPress = () => {};
</script>

<button
  type="button"
  class:light={isLight}
  class:dark={!isLight}
  class:selected={isSelected}
  class:highlighted={isHighlighted}
  class:last-move={isLastMove}
  class="square"
  aria-label={ariaLabel}
  data-square={square}
  onclick={() => onPress(square)}
>
  {#if symbol}
    <Piece
      symbol={symbol}
      label={pieceLabel}
      color={piece?.color}
      type={piece?.type}
    />
  {/if}
  {#if isHighlighted}
    <span class="highlight-marker" aria-hidden="true"></span>
  {/if}
</button>

<style>
  .square {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    border: none;
    padding: 0;
    background: transparent;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      background 120ms ease;
  }

  .square:hover,
  .square:focus-visible {
    transform: translateY(-1px);
    outline: none;
    box-shadow: inset 0 0 0 0.18rem rgba(255, 255, 255, 0.32);
  }

  .light {
    background: var(--board-light-square, #e7d7b4);
    color: #2d1e16;
  }

  .dark {
    background: var(--board-dark-square, #576272);
    color: #f6f1e7;
  }

  .selected {
    box-shadow: inset 0 0 0 0.28rem rgba(255, 215, 64, 0.88);
  }

  .highlighted {
    box-shadow: inset 0 0 0 0.18rem rgba(142, 225, 255, 0.72);
  }

  .last-move {
    background-image: linear-gradient(135deg, rgba(96, 244, 156, 0.3), rgba(96, 244, 156, 0));
  }

  .highlight-marker {
    position: absolute;
    width: 1rem;
    height: 1rem;
    border-radius: 999px;
    background: rgba(36, 44, 57, 0.24);
    box-shadow: 0 0 0 0.22rem rgba(142, 225, 255, 0.32);
    pointer-events: none;
  }
</style>
