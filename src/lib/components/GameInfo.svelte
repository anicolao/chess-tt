<script>
  export let color = 'white';
  export let activeTurn = 'w';
  export let status = 'active';
  export let winner = null;
  export let position = 'stacked';

  $: isActive = activeTurn === (color === 'white' ? 'w' : 'b') && status === 'active';
  $: statusLabel = status === 'active' ? (isActive ? 'Your move' : 'Waiting') : winner ? `${winner} won` : status;
</script>

<section
  class:active={isActive}
  class:side={position !== 'stacked'}
  class:left={position === 'left'}
  class:right={position === 'right'}
  class="clock"
  aria-label={`${color} clock`}
>
  <p class="side-label">{color}</p>
  <div class="time-face" aria-hidden="true">--:--</div>
  <p class="status-label">{statusLabel}</p>
</section>

<style>
  .clock {
    display: grid;
    justify-items: center;
    gap: 0.35rem;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    background: rgba(11, 18, 26, 0.46);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.06),
      0 0.35rem 1rem rgba(0, 0, 0, 0.18);
  }

  .clock.active {
    box-shadow:
      inset 0 0 0 1px rgba(102, 214, 255, 0.42),
      0 0 0 0.18rem rgba(102, 214, 255, 0.12),
      0 0.35rem 1rem rgba(0, 0, 0, 0.18);
  }

  p {
    margin: 0;
  }

  .side-label {
    color: #91a8b9;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .time-face {
    min-width: 6ch;
    color: #f5f7fa;
    font-family: 'SFMono-Regular', ui-monospace, monospace;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
  }

  .status-label {
    color: #dde7ef;
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (orientation: landscape) {
    .clock.side {
      height: 100%;
      min-height: 0;
      padding: 1rem 0.85rem;
      border-radius: 1.8rem;
      background:
        linear-gradient(180deg, rgba(15, 23, 32, 0.82), rgba(11, 18, 26, 0.56)),
        rgba(11, 18, 26, 0.56);
      align-content: center;
      justify-items: center;
      grid-template-rows: auto auto auto;
      gap: 0.7rem;
    }

    .clock.left {
      border-top-left-radius: 2.3rem;
      border-bottom-left-radius: 2.3rem;
    }

    .clock.right {
      border-top-right-radius: 2.3rem;
      border-bottom-right-radius: 2.3rem;
    }

    .clock.side .side-label {
      font-size: 0.82rem;
    }

    .clock.side .time-face {
      min-width: auto;
      font-size: clamp(2.5rem, 6vh, 4.4rem);
      letter-spacing: 0.04em;
    }

    .clock.side .status-label {
      font-size: 0.86rem;
      text-align: center;
      line-height: 1.25;
    }
  }
</style>
