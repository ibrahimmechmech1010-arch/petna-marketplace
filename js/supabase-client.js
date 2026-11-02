(() => {
  const config = window.PETNA_SUPABASE_CONFIG || {};
  const url = String(config.url || '').trim();
  const key = String(config.publishableKey || '').trim();

  function loadSdk() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('Supabase SDK did not load'));
      script.onerror = () => reject(new Error('Supabase SDK could not be loaded'));
      document.head.append(script);
    });
  }

  window.PETNA_BACKEND_READY = (!url || !key)
    ? Promise.resolve(null)
    : loadSdk()
      .then(sdk => sdk.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }))
      .catch(error => { console.error('Supabase setup:', error); return null; });
})();
