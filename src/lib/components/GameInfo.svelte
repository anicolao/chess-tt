<script>
  import { formatClock, formatTimeControl, getColorName } from '$lib/game/time-controls';

  export let seat = 'bottom';
  export let assignedColor = 'w';
  export let remainingMs = 0;
  export let timeControl = { initialMinutes: 15, incrementSeconds: 10 };
  export let isActive = false;
  export let status = 'active';
  export let winner = null;
  export let position = 'stacked';

  $: colorLabel = getColorName(assignedColor);
  $: clockLabel = formatClock(remainingMs);
  $: timeControlLabel = formatTimeControl(timeControl);
  $: statusLabel = status === 'active'
    ? (isActive ? 'Your move' : 'Waiting')
    : winner
      ? (winner === colorLabel ? 'Won' : 'Lost')
      : status;
  $: screenReaderLabel = `${seat} seat clock`;
</script>

<section
  class:active={isActive}
  class:flipped={seat === 'top'}
  class:side={position !== 'stacked'}
  class:left={position === 'left'}
  class:right={position === 'right'}
  class="clock"
  aria-label={`${seat} seat clock`}
>
  <p class="side-label">{screenReaderLabel}</p>
  <div class="time-face" aria-label={`${screenReaderLabel} remaining time`}>{clockLabel}</div>
  <p class="assignment-label">{colorLabel} pieces · {timeControlLabel}</p>
  <p class="status-label">{statusLabel}</p>
</section>

<style>
  .clock {
    position: relative;
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

  .clock.flipped {
    transform: rotate(180deg);
  }

  p {
    margin: 0;
  }

  .side-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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

  .assignment-label {
    color: #9ab0c0;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-align: center;
    text-transform: uppercase;
  }

  @media (orientation: landscape) {
    .clock.side {
      width: 100%;
      height: 100%;
      min-height: 0;
      padding: 1rem 0.85rem;
      border-radius: 1.8rem;
      background:
        linear-gradient(180deg, rgba(15, 23, 32, 0.82), rgba(11, 18, 26, 0.56)),
        rgba(11, 18, 26, 0.56);
      align-content: center;
      justify-items: center;
      grid-template-rows: auto auto auto auto;
      gap: 0.55rem;
    }

    .clock.left {
      align-self: start;
      border-top-left-radius: 2.3rem;
      border-bottom-left-radius: 2.3rem;
    }

    .clock.right {
      align-self: end;
      border-top-right-radius: 2.3rem;
      border-bottom-right-radius: 2.3rem;
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

    .clock.side .assignment-label {
      font-size: 0.75rem;
      line-height: 1.35;
    }
  }
</style>
