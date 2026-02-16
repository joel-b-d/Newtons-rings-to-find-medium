import React, { useState, useEffect } from 'react';
import { RefreshCw, Circle } from 'lucide-react';

export default function NewtonsRingsRefractiveIndex() {
  // --- STATE ---
  // Defaults set to 50 and 0.001 as requested
  const [radius, setRadius] = useState(50);
  const [leastCount, setLeastCount] = useState(0.001);
  const [readings, setReadings] = useState(null);

  // --- MATH HELPERS ---
  
  // Round a value to the nearest Least Count
  const snapToLC = (val, lc) => {
    return Math.round(val / lc) * lc;
  };

  // Convert a raw position into MSR, VSR, and Total
  const getVernierReadings = (val, lc) => {
    const MSD = 0.05; // Standard main scale division
    
    const msr = Math.floor(val / MSD) * MSD;
    const remainder = val - msr;
    let vsr = Math.round(remainder / lc);
    
    if (vsr < 0) vsr = 0;

    // formatting total to appropriate decimal places based on LC
    const decimals = lc.toString().split('.')[1]?.length || 3;
    const total = (msr + (vsr * lc)).toFixed(decimals);
    
    return {
      msr: msr.toFixed(2),
      vsr: vsr,
      total: total
    };
  };

  // --- GENERATION ALGORITHM ---
  const generateReadings = () => {
    const TARGET_MU = 1.382; // Target center value
    
    const generateRow = (order) => {
      let attempts = 0;
      // Physics baselines
      const baseDiam = order === 2 ? 0.35 : 0.50;

      while (attempts < 2000) {
        attempts++;

        // 1. Generate ACETONE Diameter with noise
        const dAcetoneRaw = baseDiam + (Math.random() - 0.5) * 0.1;
        const dAcetone = snapToLC(dAcetoneRaw, leastCount);

        // 2. Calculate Required AIR Diameter for ~1.38
        const dAirRaw = dAcetone * Math.sqrt(TARGET_MU);
        const dAir = snapToLC(dAirRaw, leastCount);

        // 3. Validation
        const calcMu = (dAir * dAir) / (dAcetone * dAcetone);
        
        // Strict Check: Must start with "1.38"
        const muString = calcMu.toFixed(5);
        if (!muString.startsWith("1.38")) continue; 

        // 4. Generate Positions (Drift Check for different MSRs)
        const centerAcetone = 10.0 + (Math.random() * 0.5);
        const centerAir = centerAcetone + 0.15 + (Math.random() * 0.1); 

        const acetLeftPos = centerAcetone + (dAcetone / 2);
        const acetRightPos = centerAcetone - (dAcetone / 2);
        
        const airLeftPos = centerAir + (dAir / 2);
        const airRightPos = centerAir - (dAir / 2);

        // 5. Convert to Vernier format
        const acetLeft = getVernierReadings(acetLeftPos, leastCount);
        const acetRight = getVernierReadings(acetRightPos, leastCount);
        const airLeft = getVernierReadings(airLeftPos, leastCount);
        const airRight = getVernierReadings(airRightPos, leastCount);

        // 6. "Same MSR" Prevention Check
        if (acetLeft.msr === airLeft.msr || acetRight.msr === airRight.msr) {
            continue; 
        }

        // 7. Calculate D^2 using displayed totals
        const dAcetDisplay = Math.abs(parseFloat(acetLeft.total) - parseFloat(acetRight.total));
        const dAirDisplay = Math.abs(parseFloat(airLeft.total) - parseFloat(airRight.total));
        
        const dAcetSq = (dAcetDisplay * dAcetDisplay).toFixed(5);
        const dAirSq = (dAirDisplay * dAirDisplay).toFixed(5);
        
        // Final Mu for this row (5 decimals)
        const finalRowMu = (dAirSq / dAcetSq).toFixed(5);

        return {
          acetone: { left: acetLeft, right: acetRight, dSq: dAcetSq },
          air: { left: airLeft, right: airRight, dSq: dAirSq },
          mu: finalRowMu
        };
      }
      return null;
    };

    const row2 = generateRow(2);
    const row4 = generateRow(4);

    if (row2 && row4) {
      setReadings({ order2: row2, order4: row4 });
    }
  };

  // Initial Generation
  useEffect(() => {
    generateReadings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leastCount]); 

  // Calculate Final Average Mu (5 decimals)
  // Assuming the typo "/3" meant "/2" to maintain the mathematical validty of 1.38...
  const finalMu = readings 
    ? ((parseFloat(readings.order2.mu) + parseFloat(readings.order4.mu)) / 2).toFixed(5)
    : "----";


  // --- RENDER HELPERS ---
  const renderTable = (data, nLabel) => {
    return (
      <div className="mb-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Circle size={16} className="text-blue-400" />
            <span className="font-bold tracking-wider text-sm">OBSERVATION TABLE</span>
            <span className="text-slate-400 text-xs">Order n = {nLabel}</span>
          </div>
          <span className="font-black text-slate-700/50 text-xl">n={nLabel}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono text-center">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-bold tracking-wider">
                <th className="p-3 w-32 border-r">Medium</th>
                <th className="border-r" colSpan={3}>Left Position (a)</th>
                <th className="border-r" colSpan={3}>Right Position (b)</th>
                <th className="w-24 border-r bg-orange-50 text-orange-800">D² (cm²)</th>
                <th className="w-32 bg-purple-50 text-purple-800">Medium μ</th>
              </tr>
              <tr className="bg-white text-slate-400 text-[10px] border-b border-slate-200">
                <th className="border-r"></th>
                <th className="p-1 w-16 border-r">MSR</th>
                <th className="p-1 w-12 border-r">VSR</th>
                <th className="p-1 w-20 border-r bg-slate-50 font-bold text-slate-700">Total</th>
                <th className="p-1 w-16 border-r">MSR</th>
                <th className="p-1 w-12 border-r">VSR</th>
                <th className="p-1 w-20 border-r bg-slate-50 font-bold text-slate-700">Total</th>
                <th className="border-r bg-orange-50"></th>
                <th className="bg-purple-50">Air D² / Acetone D²</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="hover:bg-rose-50/50 transition-colors">
                <td className="p-2 font-bold text-rose-700 border-r border-slate-200 bg-rose-50 text-xs font-sans uppercase">Acetone</td>
                <td className="border-r border-slate-100">{data.acetone.left.msr}</td>
                <td className="border-r border-slate-100 text-slate-500">{data.acetone.left.vsr}</td>
                <td className="border-r border-slate-200 font-bold text-rose-900 bg-rose-50/20">{data.acetone.left.total}</td>
                
                <td className="border-r border-slate-100">{data.acetone.right.msr}</td>
                <td className="border-r border-slate-100 text-slate-500">{data.acetone.right.vsr}</td>
                <td className="border-r border-slate-200 font-bold text-rose-900 bg-rose-50/20">{data.acetone.right.total}</td>
                
                <td className="border-r border-slate-200 font-bold text-orange-700 bg-orange-50/30">{data.acetone.dSq}</td>
                
                <td className="font-black text-lg text-purple-700 bg-purple-50 border-l border-slate-200" rowSpan={2}>
                  {data.mu}
                </td>
              </tr>

              <tr className="hover:bg-cyan-50/50 transition-colors border-t border-slate-100">
                <td className="p-2 font-bold text-cyan-700 border-r border-slate-200 bg-cyan-50 text-xs font-sans uppercase">Air</td>
                <td className="border-r border-slate-100">{data.air.left.msr}</td>
                <td className="border-r border-slate-100 text-slate-500">{data.air.left.vsr}</td>
                <td className="border-r border-slate-200 font-bold text-cyan-900 bg-cyan-50/20">{data.air.left.total}</td>
                
                <td className="border-r border-slate-100">{data.air.right.msr}</td>
                <td className="border-r border-slate-100 text-slate-500">{data.air.right.vsr}</td>
                <td className="border-r border-slate-200 font-bold text-cyan-900 bg-cyan-50/20">{data.air.right.total}</td>
                
                <td className="border-r border-slate-200 font-bold text-orange-700 bg-orange-50/30">{data.air.dSq}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl">
        
        {/* HEADER & SETTINGS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">NEWTON'S RINGS</h1>
                <p className="text-slate-500 font-medium">Refractive Index Calculator</p>
            </div>

            <div className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Lens Radius (cm)</label>
                    <input 
                        type="number" 
                        value={radius} 
                        onChange={(e) => setRadius(parseFloat(e.target.value))}
                        className="w-24 bg-transparent font-bold text-slate-800 border-b border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Least Count (cm)</label>
                    <input 
                        type="number" 
                        step="0.001"
                        value={leastCount} 
                        onChange={(e) => setLeastCount(parseFloat(e.target.value))}
                        className="w-24 bg-transparent font-bold text-slate-800 border-b border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        </div>

        {/* DEVICE INFO BADGE */}
        <div className="flex justify-center mb-4">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-xs font-bold">
            Device: Desktop
          </div>
        </div>

        {/* ACTION BUTTON - MOVED UP */}
        <div className="flex justify-center mb-6">
            <button 
                onClick={generateReadings}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
            >
                <RefreshCw size={18} /> GENERATE READINGS
            </button>
        </div>

        {/* TABLES */}
        {readings && (
            <>
                {renderTable(readings.order2, '2')}
                {renderTable(readings.order4, '4')}
            </>
        )}

        {/* RESULT CARD - REDESIGNED */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-slate-200">
          <div className="text-center">
            <div className="inline-block bg-slate-800 text-white px-4 py-1.5 rounded-md font-semibold text-xs uppercase tracking-wide mb-6">
              Calculation
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-6">
              Mean Refractive Index of Acetone
            </h3>
            
            <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
              <div className="text-slate-700 font-mono text-lg mb-3">
                μ = (μ₂ + μ₄) / 2
              </div>
              {readings && (
                <div className="text-slate-600 font-mono text-base">
                  μ = ({readings.order2.mu} + {readings.order4.mu}) / 2
                </div>
              )}
            </div>
            
            {readings && (
              <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <span className="text-3xl font-bold text-slate-700">μ =</span>
                <span className="text-5xl font-black text-slate-900 font-mono tracking-tight">
                  {finalMu}
                </span>
              </div>
            )}
            
            {!readings && (
              <div className="text-slate-400 text-sm italic mt-4">
                Click "GENERATE READINGS" to calculate the result
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
