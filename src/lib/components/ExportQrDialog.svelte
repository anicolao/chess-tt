<script>
  import QRCode from 'qrcode';

  export let platformId = 'chess-com';
  export let platformLabel = 'Chess.com';
  export let url = '';
  export let onClose = () => {};

  let isLoading = false;
  let qrCodeDataUrl = '';
  let qrCodeError = '';
  let generationCount = 0;

  async function updateQrCode(nextUrl, generation) {
    if (!nextUrl) {
      qrCodeDataUrl = '';
      qrCodeError = '';
      isLoading = false;
      return;
    }

    isLoading = true;
    qrCodeDataUrl = '';
    qrCodeError = '';

    try {
      const dataUrl = await QRCode.toDataURL(nextUrl, {
        margin: 1,
        width: 280,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#09121a',
          light: '#f5f7fa'
        }
      });

      if (generation !== generationCount) {
        return;
      }

      qrCodeDataUrl = dataUrl;
      isLoading = false;
    } catch (_error) {
      if (generation !== generationCount) {
        return;
      }

      qrCodeError = 'Unable to generate the QR code for this export link.';
      isLoading = false;
    }
  }

  $: {
    generationCount += 1;
    updateQrCode(url, generationCount);
  }
</script>

<div class="export-overlay">
  <div
    class="export-dialog"
    role="dialog"
    aria-label={`Export to ${platformLabel}`}
    data-export-platform={platformId}
  >
    <div class="header">
      <div>
        <p class="eyebrow">Export game</p>
        <h2>{platformLabel}</h2>
      </div>
      <button type="button" class="close-button" aria-label="Close export" on:click={onClose}>✕</button>
    </div>

    <p class="message">
      Scan this QR code with your phone to open the current game on {platformLabel} and continue from
      there.
    </p>

    <div class="qr-panel">
      {#if qrCodeDataUrl}
        <img
          class="qr-code"
          src={qrCodeDataUrl}
          alt={`QR code linking to ${platformLabel}`}
          data-qr-ready="true"
        />
      {:else if qrCodeError}
        <p class="qr-status error">{qrCodeError}</p>
      {:else if isLoading}
        <p class="qr-status">Generating QR code…</p>
      {/if}
    </div>

    <a class="open-link" href={url} target="_blank" rel="noreferrer noopener">
      Open on {platformLabel}
    </a>

    <p class="hint">If the QR code does not scan, open the link directly on your phone.</p>
  </div>
</div>

<style>
  .export-overlay {
    position: fixed;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(7, 11, 16, 0.78);
    backdrop-filter: blur(10px);
  }

  .export-dialog {
    display: grid;
    gap: 1rem;
    width: min(28rem, calc(100vw - 2rem));
    padding: 1.2rem;
    border-radius: 1.2rem;
    background: rgba(10, 16, 23, 0.97);
    box-shadow:
      0 1.2rem 2.2rem rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .eyebrow {
    margin: 0;
    color: #8eb7d8;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2,
  .message,
  .hint,
  .qr-status {
    margin: 0;
  }

  .close-button {
    border: none;
    border-radius: 999px;
    width: 2.25rem;
    height: 2.25rem;
    background: rgba(255, 255, 255, 0.08);
    color: inherit;
  }

  .qr-panel {
    display: grid;
    place-items: center;
    min-height: 18rem;
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .qr-code {
    display: block;
    width: min(100%, 17.5rem);
    height: auto;
    border-radius: 0.8rem;
    background: #f5f7fa;
  }

  .qr-status {
    color: #d8e6f3;
    text-align: center;
  }

  .qr-status.error {
    color: #ff9ab4;
  }

  .open-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-height: 3.25rem;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #66d6ff, #4f7bff);
    color: #09121a;
    font-weight: 700;
    text-decoration: none;
  }

  .hint {
    color: #b8c8d6;
    font-size: 0.92rem;
    text-align: center;
  }
</style>
