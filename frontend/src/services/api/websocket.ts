// WebSocket-Verbindungen deaktivieren
if (typeof window !== 'undefined') {
  // Überschreibe die WebSocket-Klasse
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = class DisabledWebSocket extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      // Wenn es sich um unsere WebSocket-URL handelt, verhindere die Verbindung
      if (url.toString() === 'ws://localhost:3000/ws') {
        console.log('WebSocket-Verbindung zu ws://localhost:3000/ws deaktiviert');
        throw new Error('WebSocket-Verbindungen sind deaktiviert');
      }
      // Für andere WebSocket-Verbindungen, erlaube sie
      super(url, protocols);
    }
  } as typeof WebSocket;
}

export {}; 