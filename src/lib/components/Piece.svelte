<script>
  export let symbol = '';
  export let label = '';
</script>

<span
  class="piece"
  role="img"
  aria-label={label}
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
    user-select: none;
  }
</style>
