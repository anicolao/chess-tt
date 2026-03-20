<script>
  export let color = 'white';
  export let activeTurn = 'w';
  export let status = 'active';
  export let winner = null;
  export let mirrored = false;

  $: isActive = activeTurn === (color === 'white' ? 'w' : 'b') && status === 'active';
  $: statusLabel = status === 'active' ? (isActive ? 'Your move' : 'Waiting') : winner ? `${winner} won` : status;
</script>

<section class:mirrored class:active={isActive} class="clock" aria-label={`${color} clock`}>
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

  .mirrored {
    transform: rotate(180deg);
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
</style>
