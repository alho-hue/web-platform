(async () => {
    const m = await import('@whiskeysockets/baileys');
    console.log('export keys:', Object.keys(m));
    console.log('makeInMemoryStore type:', typeof m.makeInMemoryStore);
})();