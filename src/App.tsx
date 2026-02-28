import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  Info, 
  CheckCircle2, 
  Loader2, 
  Settings,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: 'Zile', value: timeLeft.days },
    { label: 'Ore', value: timeLeft.hours },
    { label: 'Minute', value: timeLeft.minutes },
    { label: 'Secunde', value: timeLeft.seconds }
  ];

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {units.map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="glass-card w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-2">
            <span className="text-2xl md:text-3xl gold-text font-display">{unit.value.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-autumn-accent/60">{unit.label}</span>
        </div>
      ))}
    </div>
  );
};

const Section = ({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={cn("py-24 px-6 relative overflow-hidden", className)}>
    {children}
  </section>
);

const FloatingParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-autumn-accent/40 rounded-full"
        initial={{ 
          x: Math.random() * 100 + "%", 
          y: Math.random() * 100 + "%",
          opacity: 0 
        }}
        animate={{ 
          y: [null, "-100%"],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: Math.random() * 10 + 10, 
          repeat: Infinity, 
          ease: "linear",
          delay: Math.random() * 10
        }}
      />
    ))}
  </div>
);

// --- Main App ---

export default function App() {
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [adminStatus, setAdminStatus] = useState<{ connected: boolean }>({ connected: false });
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setAdminStatus(data));

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setAdminStatus({ connected: true });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRSVP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      attending: isAttending,
      guests: formData.get('guests') || 0,
      otherGuests: formData.get('otherGuests'),
      childrenCount: formData.get('childrenCount') || 0,
      needsAccommodation: formData.get('needsAccommodation') === 'on',
      diet: formData.get('diet'),
      message: formData.get('message'),
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) setFormStatus('success');
      else setFormStatus('error');
    } catch (err) {
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen selection:bg-autumn-accent/30 relative bg-autumn-deep">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
            alt="Fundal Toamnă"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-autumn-deep/40 via-autumn-deep/60 to-autumn-deep/90" />
        </div>
      </div>

      {/* Hero Section */}
      <Section className="h-screen flex flex-col items-center justify-center text-center pt-0">
        <FloatingParticles />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="relative z-10"
        >
          <span className="text-autumn-accent tracking-[0.5em] text-sm mb-6 block uppercase font-display">
            SAVE THE DATE
          </span>
          <h1 className="text-6xl md:text-8xl mb-4 gold-text">
            Maria & Andrei
          </h1>
          <div className="divider-gold" />
          <p className="text-xl md:text-2xl font-serif italic text-parchment/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Vă invităm cu bucurie să fiți alături de noi într-o zi plină de emoție, iubire și speranță.
          </p>
          <div className="flex items-center justify-center gap-8 text-autumn-accent/80 font-sans text-sm tracking-widest uppercase">
            <div className="flex flex-col items-center">
              <Calendar className="w-5 h-5 mb-2" />
              <span>Duminică, 27 Septembrie 2026</span>
            </div>
            <div className="w-px h-12 bg-autumn-accent/30" />
            <div className="flex flex-col items-center">
              <MapPin className="w-5 h-5 mb-2" />
              <span>Alba Iulia</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-autumn-accent/50"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </Section>

      {/* Invitation Text Section */}
      <Section className="bg-autumn-deep/20 py-32">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <h3 className="text-autumn-accent text-sm uppercase tracking-widest">Cu binecuvântarea părinților:</h3>
                <div className="space-y-2">
                  <p className="text-2xl italic">Alin & Maria Ghiura</p>
                  <p className="text-2xl italic">Sorin & Delia Mureșan</p>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-autumn-accent text-sm uppercase tracking-widest">Sub ocrotirea nașilor:</h3>
                <div className="space-y-2">
                  <p className="text-2xl italic">Sergiu & Ștefania Muntean</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Countdown Section */}
      <Section className="bg-autumn-deep/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl mb-12 gold-text">Au mai rămas....</h2>
          <CountdownTimer targetDate="2026-09-27T12:00:00" />
        </div>
      </Section>

      {/* Program Section */}
      <Section id="details">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl gold-text">Programul Zilei</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="glass-card p-12 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full border border-autumn-accent/30 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-autumn-accent" />
              </div>
              <h3 className="text-2xl mb-4 gold-text">CUNUNIA RELIGIOASĂ</h3>
              <p className="text-xl mb-2">ora 12:00</p>
              <p className="text-parchment/70 mb-8">Biserica Ortodoxă, Oarda de Jos</p>
              <a 
                href="https://maps.google.com/?q=Biserica+Ortodoxa+Oarda+de+Jos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-autumn-accent border border-autumn-accent/30 px-6 py-2 rounded-full hover:bg-autumn-accent/10 transition-all uppercase tracking-widest text-xs"
              >
                Vezi locația
              </a>
            </motion.div>

            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="glass-card p-12 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full border border-autumn-accent/30 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-autumn-accent" />
              </div>
              <h3 className="text-2xl mb-4 gold-text">PETRECEREA</h3>
              <p className="text-xl mb-2">ora 14:00</p>
              <p className="text-parchment/70 mb-8">Mariss Events, Alba Iulia</p>
              <a 
                href="https://maps.google.com/?q=Mariss+Events+Alba+Iulia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-autumn-accent border border-autumn-accent/30 px-6 py-2 rounded-full hover:bg-autumn-accent/10 transition-all uppercase tracking-widest text-xs"
              >
                Vezi locația
              </a>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* RSVP Section */}
      <Section id="rsvp" className="bg-autumn-deep/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Heart className="w-10 h-10 text-autumn-accent mx-auto mb-6" />
            <h2 className="text-4xl mb-4 gold-text">Confirmare</h2>
            <p className="text-parchment/60 uppercase tracking-widest text-sm">Vă rugăm să ne confirmați prezența dvs până la data de 10 August 2026</p>
          </div>

          <AnimatePresence mode="wait">
            {formStatus === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 text-center space-y-6"
              >
                <CheckCircle2 className="w-16 h-16 text-autumn-accent mx-auto" />
                <h3 className="text-2xl">Vă mulțumim!</h3>
                <p className="text-parchment/70">Răspunsul dumneavoastră a fost înregistrat. Abia așteptăm să ne vedem!</p>
                <button 
                  onClick={() => setFormStatus('idle')}
                  className="text-autumn-accent hover:text-autumn-accent/80 transition-colors uppercase tracking-widest text-sm"
                >
                  Trimite alt răspuns
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmitRSVP}
                className="space-y-8 glass-card p-8 md:p-12"
              >
                <div className="space-y-2">
                  <label className="text-autumn-accent text-sm uppercase tracking-widest block">Nume Complet</label>
                  <input 
                    required
                    name="name"
                    type="text" 
                    placeholder="Introduceți numele dumneavoastră"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-autumn-accent text-sm uppercase tracking-widest block">Veți fi alături de noi?</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setIsAttending(true)}
                        className={cn(
                          "flex-1 py-3 rounded-lg border transition-all",
                          isAttending === true ? "bg-autumn-accent text-autumn-deep border-autumn-accent" : "border-white/10 hover:border-autumn-accent/30"
                        )}
                      >
                        Da, cu mare drag
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAttending(false)}
                        className={cn(
                          "flex-1 py-3 rounded-lg border transition-all",
                          isAttending === false ? "bg-autumn-accent text-autumn-deep border-autumn-accent" : "border-white/10 hover:border-autumn-accent/30"
                        )}
                      >
                        Din păcate, nu
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-autumn-accent text-sm uppercase tracking-widest block">Adulți</label>
                      <input 
                        name="guests"
                        type="number" 
                        min="1"
                        max="10"
                        defaultValue="1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-autumn-accent text-sm uppercase tracking-widest block">Copii</label>
                      <input 
                        name="childrenCount"
                        type="number" 
                        min="0"
                        max="10"
                        defaultValue="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-autumn-accent text-sm uppercase tracking-widest block">Numele persoanelor însoțitoare</label>
                  <input 
                    name="otherGuests"
                    type="text" 
                    placeholder="ex: Numele soțului/soției, copiilor"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    id="needsAccommodation"
                    name="needsAccommodation"
                    type="checkbox" 
                    className="w-5 h-5 accent-autumn-accent bg-white/5 border-white/10 rounded"
                  />
                  <label htmlFor="needsAccommodation" className="text-parchment/80 text-sm cursor-pointer select-none">
                    Aveți nevoie de cazare? (cameră de hotel)
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-autumn-accent text-sm uppercase tracking-widest block">Preferințe Culinare / Alergii</label>
                  <input 
                    name="diet"
                    type="text" 
                    placeholder="ex: Vegetarian, Alergii"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-autumn-accent text-sm uppercase tracking-widest block">Mesaj pentru miri</label>
                  <textarea 
                    name="message"
                    rows={4}
                    placeholder="Lăsați un gând bun pentru Maria & Andrei..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-autumn-accent/50 transition-colors resize-none"
                  />
                </div>

                <button 
                  disabled={isAttending === null || formStatus === 'submitting'}
                  type="submit"
                  className="w-full bg-autumn-accent hover:bg-autumn-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-autumn-deep font-display py-4 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Trimite Confirmarea <Sparkles className="w-4 h-4" /></>
                  )}
                </button>
                
                {formStatus === 'error' && (
                  <p className="text-red-400 text-center text-sm">A apărut o eroare. Vă rugăm să încercați din nou.</p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 text-center space-y-8">
        <h2 className="text-3xl gold-text">Va așteptăm cu drag!</h2>
        <div className="divider-gold opacity-30" />
        <p className="text-parchment/40 text-sm font-sans tracking-widest uppercase">© 2026 Maria & Andrei Ghiura</p>
        
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-parchment/20 hover:text-autumn-accent transition-colors flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <Settings className="w-3 h-3" /> Configurare Admin
          </button>
        </div>

        <AnimatePresence>
          {showAdmin && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-8 overflow-hidden"
            >
              <div className="glass-card p-6 inline-block text-left max-w-md">
                <h4 className="text-autumn-accent mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Integrare Google Sheets
                </h4>
                <p className="mb-6 text-xs normal-case tracking-normal text-parchment/60">
                  Conectați contul Google pentru a stoca confirmările RSVP într-un tabel. 
                  Un tabel nou numit "Wedding RSVPs - Maria & Andrei" va fi creat automat.
                </p>
                <button 
                  onClick={handleConnectGoogle}
                  className={cn(
                    "w-full py-2 rounded border transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest",
                    adminStatus.connected ? "border-green-500/50 text-green-400" : "border-autumn-accent/30 text-autumn-accent hover:bg-autumn-accent/10"
                  )}
                >
                  {adminStatus.connected ? (
                    <><CheckCircle2 className="w-4 h-4" /> Conectat la Google</>
                  ) : (
                    "Conectează Google Sheets"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
