<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import Board from '$lib/components/Board.svelte';
  import Controls from '$lib/components/Controls.svelte';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import { getBoardRows } from '$lib/game/chess-game';
  import { appStore, gameActions, gameState } from '$lib/redux/store';

  const dispatch = (action) => appStore.dispatch(action);
  let appReady = false;

  onMount(() => {
    appReady = true;
  });

  $: state = $gameState;
  $: boardRows = getBoardRows(state.currentFen, state.ui, state.lastMove);
  $: canUndo = state.events.length > 1;
  $: canResign = state.status === 'active';
</script>

<svelte:head>
  <title>Chess Tabletop MVP</title>
  <meta name="description" content="A touch-friendly local multiplayer chess board for tabletop play." />
</svelte:head>

<div class="tabletop-app" data-app-ready={appReady}>
  <GameInfo
    color="black"
    mirrored={true}
    activeTurn={state.turn}
    message={state.message}
    capturedPieces={state.captured.white}
    status={state.status}
    winner={state.winner}
  />

  <main class="play-area">
    <div class="board-frame">
      <div class="title-block">
        <p class="eyebrow">Chess Tabletop MVP</p>
        <h1>Local play, touch-ready, and recoverable after reload.</h1>
      </div>

      <Board
        rows={boardRows}
        onPress={(square) => dispatch(gameActions.squarePressed(square))}
      />
    </div>

    <Controls
      {canUndo}
      {canResign}
      onNewGame={() => dispatch(gameActions.newGameRequested())}
      onUndo={() => dispatch(gameActions.undoRequested())}
      onResign={() => dispatch(gameActions.resignRequested())}
    />
  </main>

  <GameInfo
    color="white"
    activeTurn={state.turn}
    message={state.message}
    capturedPieces={state.captured.black}
    status={state.status}
    winner={state.winner}
  />
</div>

<style>
  .tabletop-app {
    display: grid;
    gap: 1rem;
    max-width: 72rem;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
  }

  .play-area {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 1rem;
  }

  .board-frame {
    display: grid;
    gap: 1rem;
    justify-items: center;
    width: 100%;
  }

  .title-block {
    display: grid;
    gap: 0.35rem;
    text-align: center;
    max-width: 38rem;
  }

  .eyebrow {
    margin: 0;
    color: #9cb6c8;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.7rem, 3vw, 2.35rem);
    line-height: 1.1;
  }

  @media (min-width: 900px) {
    .tabletop-app {
      padding: 1.5rem;
      grid-template-rows: auto 1fr auto;
    }
  }
</style>
