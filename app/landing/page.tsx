'use client';

import useInstallPrompt from '@/hooks/useInstallPrompt';
import { useAddToast } from '@/store/appStore.selectors';

export default function DetailedLanding() {
  const { install, installAvailable } = useInstallPrompt();
  const addToast = useAddToast();

  const handleInstall = async () => {
    if (!installAvailable) {
      addToast('Direct install is not supported by your browser. Please tap the Share icon or browser menu, then "Add to Home Screen".', 'info');
      return;
    }
    await install({
      onAccepted: () => addToast('App installation started.', 'success'),
      onDismissed: () => addToast('Install prompt dismissed.', 'info'),
    });
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface selection:bg-primary/20">


      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
          <span className="material-symbols-outlined text-sm">verified</span>
          <span className="font-label font-bold text-[10px] uppercase tracking-widest">Keffi&apos;s Favorite Shawarma App</span>
        </div>
        <h1 className="font-headline font-bold text-6xl md:text-8xl leading-none mb-6">
          The Future of <br/> <span className="text-primary italic">Flavor.</span>
        </h1>
        <p className="font-body text-outline text-lg md:text-xl max-w-lg mx-auto mb-12">
          Soji&apos;s Shawarma is right inside Nasarawa State University, Keffi, in front of the old girls hostel. Order fast, track updates, and enjoy fresh shawarma made for students, staff, and everyone nearby.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={handleInstall}
            className="bg-primary text-on-primary px-10 py-5 rounded-3xl font-headline font-bold text-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">install_mobile</span>
            Download App
          </button>
        </div>
      </section>

      {/* App Highlights */}
      <section className="bg-surface-container-lowest py-24 px-8 border-y border-outline-variant/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </div>
            <h3 className="font-headline font-bold text-2xl">Hyper-Fast Delivery</h3>
            <p className="font-body text-outline leading-relaxed">Our logistics network is optimized for speed. Hot, fresh, and at your door in under 30 minutes.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">send</span>
            </div>
            <h3 className="font-headline font-bold text-2xl">Live Order Updates</h3>
            <p className="font-body text-outline leading-relaxed">Place your order with confidence and stay in the loop as it moves from confirmation to delivery.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">no_accounts</span>
            </div>
            <h3 className="font-headline font-bold text-2xl">Zero Friction</h3>
            <p className="font-body text-outline leading-relaxed">No signups, no complex forms. Order as a guest and pay with ease. We value your hunger, not your data.</p>
          </div>
        </div>
      </section>

      {/* Share & Download Section */}
      <section className="py-24 px-8 text-center bg-on-surface text-surface relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="font-headline font-bold text-4xl mb-6">Keep Soji&apos;s On Your Phone</h2>
          <p className="font-body text-surface/60 mb-10">On Vercel and other HTTPS hosts, the app can be installed straight from the browser. If your browser does not show a prompt, use the menu and choose Add to Home Screen.</p>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-between gap-4 border border-white/10">
            <code className="text-primary-container font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">https://soji-shawarma.app</code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText('https://soji-shawarma.app');
                addToast('App link copied.', 'success');
              }}
              className="bg-primary text-on-primary px-6 py-2 rounded-xl font-label font-bold text-xs uppercase"
            >
              Copy Link
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 text-center border-t border-outline-variant/10">
        <p className="font-label font-bold text-[10px] uppercase tracking-[0.2em] opacity-40">© 2024 Soji Shawarma Spot • Crafted for Excellency</p>
      </footer>
    </div>
  );
}
