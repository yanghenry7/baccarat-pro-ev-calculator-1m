
import React, { useState, useEffect } from 'react';
import { DeckCounts, Payouts, CalculationResult, EVResult } from './types';
import { INITIAL_DECK_COUNT, TOTAL_RANKS, DEFAULT_PAYOUTS, RANK_LABELS } from './constants';
import { calculateEV } from './logic/baccaratLogic';

const App: React.FC = () => {
  const [counts, setCounts] = useState<DeckCounts>(() => {
    const initial: DeckCounts = {};
    TOTAL_RANKS.forEach(r => {
      initial[r] = INITIAL_DECK_COUNT;
    });
    return initial;
  });

  const [bankroll, setBankroll] = useState<number>(1000000);
  const [rolling, setRolling] = useState<number>(1.4);
  const [payouts, setPayouts] = useState<Payouts>(DEFAULT_PAYOUTS);
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const runCalc = async () => {
      setIsCalculating(true);
      // Small timeout to allow UI update
      setTimeout(async () => {
        const res = await calculateEV(counts, payouts, rolling);
        setResults(res);
        setIsCalculating(false);
      }, 0);
    };
    runCalc();
  }, [counts, payouts, rolling]);

  const updateCount = (rank: number, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [rank]: Math.max(0, prev[rank] + delta)
    }));
  };

  const handlePayoutChange = (key: string, value: string, bonusKey?: number) => {
    const num = parseFloat(value) || 0;
    setPayouts(prev => {
      if (key === 'tieBonus' && bonusKey !== undefined) {
        return { ...prev, tieBonus: { ...prev.tieBonus, [bonusKey]: num } };
      }
      if (key.startsWith('tiger.')) {
        const subKey = key.split('.')[1] as keyof Payouts['tiger'];
        return { ...prev, tiger: { ...prev.tiger, [subKey]: num } };
      }
      if (key.startsWith('tigerPair.')) {
        const subKey = key.split('.')[1] as keyof Payouts['tigerPair'];
        return { ...prev, tigerPair: { ...prev.tigerPair, [subKey]: num } };
      }
      return { ...prev, [key as keyof Payouts]: num };
    });
  };

  const resetShoe = () => {
    const initial: DeckCounts = {};
    TOTAL_RANKS.forEach(r => {
      initial[r] = INITIAL_DECK_COUNT;
    });
    setCounts(initial);
  };

  const calculateKellyBet = (item: EVResult) => {
    if (item.ev <= 0 || item.payout <= 0) return 0;
    const fraction = item.ev / item.payout;
    return Math.floor(bankroll * fraction);
  };

  const getAllPositiveEVBets = (): EVResult[] => {
    if (!results) return [];
    const all = [
      results.player, results.banker, results.tie,
      results.playerPair, results.bankerPair, ...results.tieBonuses,
      results.tiger, results.smallTiger, results.bigTiger, results.tigerTie,
      results.tigerPair
    ];
    return all.filter(item => item.ev > 0).sort((a, b) => b.ev - a.ev);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6">
      <header className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Baccarat Pro Calculator</h1>
          <p className="text-sm text-slate-400 uppercase tracking-widest">Combinatorial Analysis Engine</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`bg-slate-800 px-4 py-2 rounded border transition-colors ${isCalculating ? 'border-blue-500/50' : 'border-slate-700'}`}>
            <span className="text-xs text-slate-500 block uppercase">Remaining Cards</span>
            <span className="text-xl font-bold text-yellow-500 mono">{results?.totalCards || 0}</span>
          </div>
          <button
            onClick={resetShoe}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition-colors shadow-lg shadow-red-900/20"
          >
            RESET SHOE
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Loading Overlay */}
        {isCalculating && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
            <div className="bg-slate-800 border border-blue-500/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-400 font-bold text-sm tracking-widest uppercase animate-pulse">Exact Calculation...</span>
            </div>
          </div>
        )}

        <div className="lg:col-span-4 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Card Inventory
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-4">
            {TOTAL_RANKS.map(rank => (
              <div key={rank} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className={`text-2xl font-black mono ${rank >= 10 ? 'text-purple-400' : 'text-slate-300'}`}>
                    {RANK_LABELS[rank]}
                  </span>
                  <span className="text-lg font-bold text-blue-400 mono">{counts[rank]}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCount(rank, -1)}
                    className="flex-1 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 py-1 rounded transition-colors text-xl font-bold"
                  >-</button>
                  <button
                    onClick={() => updateCount(rank, 1)}
                    className="flex-1 bg-slate-800 hover:bg-blue-900/40 text-slate-400 hover:text-blue-400 py-1 rounded transition-colors text-xl font-bold"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-full">
            <h2 className="text-lg font-semibold mb-6 flex justify-between items-center">
              <span>Execution Analysis</span>
              <span className="text-xs text-slate-500 font-normal uppercase">Exact Prob / EV</span>
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {results && [
                results.player, results.banker, results.tie,
                results.playerPair, results.bankerPair,
                results.tiger, results.smallTiger, results.bigTiger, results.tigerTie,
                results.tigerPair
              ].map((item, idx) => {
                const kellyAmount = calculateKellyBet(item);
                const isPositive = item.ev > 0;
                return (
                  <div key={idx} className={`bg-slate-900/80 p-4 rounded-lg border ${isPositive ? 'border-green-500/50 shadow-lg shadow-green-900/10' : 'border-slate-700'}`}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xl font-bold text-slate-200">{item.label}</span>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${isPositive ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                          EV: {(item.ev * 100).toFixed(4)}%
                        </div>
                        {isPositive && (
                          <div className="text-[10px] text-green-500 uppercase font-bold tracking-wider">
                            Recommend: ${kellyAmount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 uppercase">Exact Prob</span>
                      <span className="text-lg font-bold text-yellow-500">{(item.probability * 100).toFixed(4)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-800/50 rounded-xl p-6 border border-slate-700 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1.1c.53-.25 1.01-.603 1.411-1.031" />
              </svg>
              Capital (本金)
            </h2>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded pl-7 pr-3 py-3 text-xl font-bold text-green-400 mono focus:ring-1 focus:ring-green-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Rolling (洗碼)
            </h2>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                <input
                  type="number"
                  step="0.1"
                  value={rolling}
                  onChange={(e) => setRolling(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded pr-10 pl-3 py-3 text-xl font-bold text-blue-400 mono focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-400">
              和寶 (Tie Point Bonuses)
            </h2>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(payouts.tieBonus).map((pt) => {
                const point = Number(pt);
                const bonusRes = results?.tieBonuses.find(b => b.label.startsWith(pt));
                const kellyAmt = bonusRes ? calculateKellyBet(bonusRes) : 0;
                return (
                  <div key={point} className={`bg-slate-900 p-3 rounded border ${bonusRes && bonusRes.ev > 0 ? 'border-green-500/40' : 'border-slate-700'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-300">{point}點和</span>
                      <span className={`text-[11px] mono ${bonusRes && bonusRes.ev > 0 ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                        {bonusRes ? (bonusRes.ev * 100).toFixed(4) : '0'}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">Prob: {bonusRes ? (bonusRes.probability * 100).toFixed(4) : '0'}%</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-slate-500 font-bold">Payout</span>
                      <input
                        type="number"
                        value={payouts.tieBonus[point]}
                        onChange={(e) => handlePayoutChange('tieBonus', e.target.value, point)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none"
                      />
                    </div>
                    {kellyAmt > 0 && (
                      <div className="text-[10px] text-green-500 font-bold text-center bg-green-500/10 rounded py-1">
                        Bet: ${kellyAmt.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
              Tiger Settings
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Banker 6 Win (Super 6)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">2-Card Payout</label>
                    <input type="number" value={payouts.tiger.twoCards} onChange={(e) => handlePayoutChange('tiger.twoCards', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">3-Card Payout</label>
                    <input type="number" value={payouts.tiger.threeCards} onChange={(e) => handlePayoutChange('tiger.threeCards', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Tiger Side Bets</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Small (22x)</label>
                    <input type="number" value={payouts.smallTiger} onChange={(e) => handlePayoutChange('smallTiger', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Big (50x)</label>
                    <input type="number" value={payouts.bigTiger} onChange={(e) => handlePayoutChange('bigTiger', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Tie (35x)</label>
                    <input type="number" value={payouts.tigerTie} onChange={(e) => handlePayoutChange('tigerTie', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Tiger Pair</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Same (100x)</label>
                    <input type="number" value={payouts.tigerPair.same} onChange={(e) => handlePayoutChange('tigerPair.same', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Dual (20x)</label>
                    <input type="number" value={payouts.tigerPair.dual} onChange={(e) => handlePayoutChange('tigerPair.dual', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Single (4x)</label>
                    <input type="number" value={payouts.tigerPair.single} onChange={(e) => handlePayoutChange('tigerPair.single', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto bg-slate-800 border-t border-blue-900/50 p-6 rounded-t-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isCalculating ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`}></span>
              Strategic Recommendations
            </h4>

            <div className="flex flex-wrap gap-3">
              {(() => {
                const positiveBets = getAllPositiveEVBets();
                if (positiveBets.length === 0) {
                  return (
                    <div className="bg-slate-900/50 border border-slate-700 px-4 py-3 rounded-xl flex items-center gap-3">
                      <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Mathematical Advantage Wait</span>
                    </div>
                  );
                }

                return positiveBets.map((bet, i) => {
                  const amt = calculateKellyBet(bet);
                  return (
                    <div key={i} className="bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-xl flex items-center gap-4 transition-all hover:bg-green-500/20 group">
                      <div className="flex flex-col">
                        <span className="text-green-400 text-xs font-black uppercase tracking-tighter">{bet.label}</span>
                        <span className="text-white text-xl font-black">${amt.toLocaleString()}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-green-500/20"></div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Exact EV</span>
                        <span className="text-green-500 font-mono font-bold">{(bet.ev * 100).toFixed(4)}%</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-tighter">
              {isCalculating ? 'Engine: Calculating...' : 'Engine: Exact-Combinatorial-v2.0'}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 h-4 rounded-sm ${results ? 'bg-green-500 animate-pulse' : 'bg-slate-700'} ${isCalculating ? 'bg-blue-500 animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
