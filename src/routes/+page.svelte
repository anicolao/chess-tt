<script>
  import { onDestroy, onMount } from 'svelte';
  import '../app.css';
  import Board from '$lib/components/Board.svelte';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { getBoardRows } from '$lib/game/chess-game';
  import { appStore, gameActions, gameState } from '$lib/redux/store';

  const settingsCorners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const dispatch = (action) => appStore.dispatch(action);
  // This flips after hydration so interaction tests can wait on a deterministic ready marker.
  let isHydrated = false;
  let activeSettingsCorner = null;

  onMount(() => {
    isHydrated = true;
  });

  onDestroy(() => {
    isHydrated = false;
  });

  $: state = $gameState;
  $: boardRows = getBoardRows(state.currentFen, state.ui, state.lastMove);
  $: canUndo = state.events.length > 1;
  $: canResign = state.status === 'active';

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

  function settingsLabel(corner) {
    return `Open ${corner.replace(/-/g, ' ')} settings`;
  }
</script>

<svelte:head>
  <title>Chess Tabletop MVP</title>
  <meta name="description" content="A touch-friendly local multiplayer chess board for tabletop play." />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="tabletop-app" data-app-ready={isHydrated}>
  <GameInfo
    color="black"
    mirrored={true}
    activeTurn={state.turn}
    status={state.status}
    winner={state.winner}
  />

  <main class="play-area">
    <div class="board-frame">
      {#each settingsCorners as corner}
        <button
          type="button"
          class:top-trigger={corner.startsWith('top')}
          class={`settings-trigger ${corner}`}
          aria-label={settingsLabel(corner)}
          on:click={() => toggleSettings(corner)}
        >
          ⚙
        </button>
      {/each}

      <Board rows={boardRows} onPress={(square) => dispatch(gameActions.squarePressed(square))} />

      {#if activeSettingsCorner}
        <SettingsDialog
          corner={activeSettingsCorner}
          message={state.message}
          status={state.status}
          winner={state.winner}
          capturedWhite={state.captured.white}
          capturedBlack={state.captured.black}
          {canUndo}
          {canResign}
          onClose={closeSettings}
          onNewGame={() => dispatchAndClose(gameActions.newGameRequested())}
          onUndo={() => dispatchAndClose(gameActions.undoRequested())}
          onResign={() => dispatchAndClose(gameActions.resignRequested())}
        />
      {/if}
    </div>
  </main>

  <GameInfo
    color="white"
    activeTurn={state.turn}
    status={state.status}
    winner={state.winner}
  />
</div>

<style>
  .tabletop-app {
    display: grid;
    gap: 0.7rem;
    max-width: 84rem;
    margin: 0 auto;
    padding: 0.85rem;
    min-height: 100vh;
    align-content: center;
  }

  .play-area {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.5rem;
  }

  .board-frame {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
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

  @media (min-width: 900px) {
    .tabletop-app {
      padding: 1rem 1.4rem;
      grid-template-rows: auto 1fr auto;
    }
  }

  @media (orientation: landscape) {
    .tabletop-app {
      gap: 0.55rem;
      max-width: 100rem;
      padding: 0.6rem 1.25rem;
      grid-template-rows: auto 1fr auto;
    }

    .play-area {
      gap: 0.4rem;
    }

    .board-frame {
      padding: 1.4rem 1.8rem;
    }
  }
</style>
