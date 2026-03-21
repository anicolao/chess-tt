<script>
  import { onDestroy, onMount } from 'svelte';
  import '../app.css';
  import Board from '$lib/components/Board.svelte';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { getBoardRows } from '$lib/game/chess-game';
  import { appStore, gameActions, gameState } from '$lib/redux/store';

  const playerSettingsAnchors = [
    { seat: 'top', corner: 'top-left' },
    { seat: 'bottom', corner: 'bottom-right' }
  ];
  const dispatch = (action) => appStore.dispatch(action);
  // This flips after hydration so interaction tests can wait on a deterministic ready marker.
  let isHydrated = false;
  let activeSettingsCorner = null;
  let clockIntervalId = null;

  onMount(() => {
    isHydrated = true;
    dispatch(gameActions.clockTicked(Date.now()));
    clockIntervalId = window.setInterval(() => {
      dispatch(gameActions.clockTicked(Date.now()));
    }, 1000);
  });

  onDestroy(() => {
    isHydrated = false;
    if (clockIntervalId) {
      window.clearInterval(clockIntervalId);
    }
  });

  $: state = $gameState;
  $: boardRows = getBoardRows(state.currentFen, state.ui, state.lastMove);
  $: canUndo = state.events.length > 1;
  $: canResign = state.status === 'active';
  $: topSeatColor = state.timerSettings.seatColors.top;
  $: bottomSeatColor = state.timerSettings.seatColors.bottom;
  $: activeSeat = state.timerState.activeSeat;
  $: activeSettingsSeat = playerSettingsAnchors.find(({ corner }) => corner === activeSettingsCorner)?.seat ?? 'bottom';

  function toggleSettings(corner) {
    activeSettingsCorner = activeSettingsCorner === corner ? null : corner;
  }

  function closeSettings() {
    activeSettingsCorner = null;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeSettings();
    }
  }

  function dispatchAndClose(action) {
    closeSettings();
    dispatch(action);
  }

  function dispatchClockSettings(timeSettings) {
    dispatch(gameActions.timeControlsConfigured({
      ...timeSettings,
      now: Date.now()
    }));
  }

  function settingsLabel(seat) {
    return `Open ${seat} seat settings`;
  }
</script>

<svelte:head>
  <title>Chess Tabletop MVP</title>
  <meta name="description" content="A touch-friendly local multiplayer chess board for tabletop play." />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="tabletop-shell" data-app-ready={isHydrated}>
  <div class="tabletop-app">
    <div class="clock-slot clock-slot-black">
      <GameInfo
        seat="top"
        position="left"
        assignedColor={topSeatColor}
        remainingMs={state.timerState.seats.top.remainingMs}
        timeControl={state.timerSettings.seats.top}
        isActive={activeSeat === 'top' && state.status === 'active'}
        status={state.status}
        winner={state.winner}
      />
    </div>

    <main class="play-area">
      <div class="board-frame">
        {#each playerSettingsAnchors as control}
          <button
            type="button"
            class:top-trigger={control.corner.startsWith('top')}
            class={`settings-trigger ${control.corner}`}
            aria-label={settingsLabel(control.seat)}
            on:click={() => toggleSettings(control.corner)}
          >
            ⚙
          </button>
        {/each}

        <Board rows={boardRows} onPress={(square) => dispatch(gameActions.squarePressed({ square, now: Date.now() }))} />

        {#if activeSettingsCorner}
          <SettingsDialog
            corner={activeSettingsCorner}
            invokingSeat={activeSettingsSeat}
            message={state.message}
            status={state.status}
            winner={state.winner}
            capturedWhite={state.captured.white}
            capturedBlack={state.captured.black}
            timeSettings={state.timerSettings}
            {canUndo}
            {canResign}
            onClose={closeSettings}
            onNewGame={() => dispatchAndClose(gameActions.newGameRequested({ now: Date.now() }))}
            onUndo={() => dispatchAndClose(gameActions.undoRequested({ now: Date.now() }))}
            onResign={() => dispatchAndClose(gameActions.resignRequested({ now: Date.now() }))}
            onApplyTimeControls={dispatchClockSettings}
          />
        {/if}
      </div>
    </main>

    <div class="clock-slot clock-slot-white">
      <GameInfo
        seat="bottom"
        position="right"
        assignedColor={bottomSeatColor}
        remainingMs={state.timerState.seats.bottom.remainingMs}
        timeControl={state.timerSettings.seats.bottom}
        isActive={activeSeat === 'bottom' && state.status === 'active'}
        status={state.status}
        winner={state.winner}
      />
    </div>
  </div>
</div>

<style>
  .tabletop-shell {
    display: grid;
    place-items: center;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }

  .tabletop-app {
    display: grid;
    align-items: stretch;
    gap: 1rem;
    width: min(100vw, 100rem);
    max-width: 100vw;
    padding: 0.6rem 0.75rem;
    height: 100dvh;
    grid-template-columns: minmax(8.5rem, 12rem) minmax(0, 1fr) minmax(8.5rem, 12rem);
    grid-template-rows: minmax(0, 1fr);
  }

  .play-area {
    display: grid;
    grid-column: 2;
    min-width: 0;
    min-height: 0;
    justify-items: center;
    align-content: center;
    gap: 0;
  }

  .clock-slot {
    display: grid;
    min-width: 0;
    min-height: 0;
  }

  .board-frame {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    padding: 1.8rem;
  }

  .settings-trigger {
    position: absolute;
    z-index: 2;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    border-radius: 999px;
    background: rgba(11, 18, 26, 0.78);
    color: #e8eef4;
    font-size: 1.15rem;
    box-shadow:
      0 0.45rem 1rem rgba(0, 0, 0, 0.22),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
  }

  .settings-trigger.top-trigger {
    transform: rotate(180deg);
  }

    .settings-trigger.top-left,
    .settings-trigger.top-right {
    top: 0;
  }

  .settings-trigger.bottom-left,
  .settings-trigger.bottom-right {
    bottom: 0;
  }

  .settings-trigger.top-left,
  .settings-trigger.bottom-left {
    left: 0;
  }

  .settings-trigger.top-right,
  .settings-trigger.bottom-right {
    right: 0;
  }

  .clock-slot-black {
    grid-column: 1;
  }

  .clock-slot-white {
    grid-column: 3;
  }

  @media (min-width: 900px) {
    .tabletop-app {
      padding: 0.8rem 1.2rem;
    }
  }

  @media (orientation: landscape) {
    .clock-slot-black {
      align-content: start;
      padding-block: 1.6rem 0.7rem;
    }

    .clock-slot-white {
      align-content: end;
      padding-block: 0.7rem 1.6rem;
    }

    .board-frame {
      padding: 1.2rem 1.4rem;
    }
  }

  @media (orientation: portrait) {
    .tabletop-app {
      width: 100vw;
      height: 100dvh;
      padding: 0.75rem;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 0.75rem;
    }

    .clock-slot-black,
    .clock-slot-white,
    .play-area {
      grid-column: 1;
    }

    .clock-slot-black {
      grid-row: 1;
      align-content: start;
    }

    .play-area {
      grid-row: 2;
    }

    .clock-slot-white {
      grid-row: 3;
      align-content: end;
    }

    .board-frame {
      width: 100%;
      height: 100%;
      padding: 0.5rem 2.2rem;
    }
  }
</style>
