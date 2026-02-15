import React, { useState } from 'react';
import { RefreshCw, Circle, Calculator } from 'lucide-react';

export default function NewtonsRingsRefractiveIndex() {
  const [radiusOfCurvature, setRadiusOfCurvature] = useState(50);
  const LEAST_COUNT = 0.005;
  
  const wavelengthOptions = {
    sodium: { name: 'Sodium (Na)', value: 5893, color: 'Yellow' },
    neon: { name: 'Neon (Ne)', value: 6402, color: 'Red-Orange' },
    helium: { name: 'Helium (He)', value: 5876, color: 'Yellow' },
    mercury: { name: 'Mercury (Hg)', value: 5461, color: 'Green' },
    hydrogen: { name: 'Hydrogen (H)', value: 6563, color: 'Red' }
  };
  
  const [selectedWavelength, setSelectedWavelength] = useState('sodium');
  
  const [readings, setReadings] = useState({
    order2: {
      acetone: {
        reading_a: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' },
        reading_b: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' }
      },
      air: {
        reading_a: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' },
        reading_b: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' }
      }
    },
    order4: {
      acetone: {
        reading_a: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' },
        reading_b: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' }
      },
      air: {
        reading_a: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' },
        reading_b: { left_msr: '', left_vsr: '', right_msr: '', right_vsr: '' }
      }
    }
  });

  const generateRandomReadings = () => {
    const now = new Date();
    const seed = (now.getSeconds() * 1000) + (now.getMinutes() * 100) + now.getDate();
    
    const random = (offset) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
    
    const generateReading = (medium, order, position, offset) => {
      let baseDiameter;
      if (medium === 'acetone') {
        baseDiameter = order === 2 ? 0.400 : 0.580; 
      } else {
        baseDiameter = order === 2 ? 0.465 : 0.675; 
      }
      
      const variation = (random(offset) - 0.5) * 0.015;
      const diameter = baseDiameter + variation;
      const center = 10.0 + (random(offset + 50) * 2); 
      const leftTotal = center + (diameter / 2);
      const rightTotal = center - (diameter / 2);
      
      const generateMSRVSR = (total) => {
        const msr = Math.floor(total * 10) / 10;
        const remainder = total - msr;
        const vsr = Math.round(remainder / LEAST_COUNT);
        return { msr: parseFloat(msr.toFixed(3)), vsr };
      };
      
      const left = generateMSRVSR(leftTotal);
      const right = generateMSRVSR(rightTotal);
      
      return {
        left_msr: left.msr,
        left_vsr: left.vsr,
        right_msr: right.msr,
        right_vsr: right.vsr
      };
    };
    
    let offset = 0;
    setReadings({
      order2: {
        acetone: {
          reading_a: generateReading('acetone', 2, 'a', offset++),
          reading_b: generateReading('acetone', 2, 'b', offset++)
        },
        air: {
          reading_a: generateReading('air', 2, 'a', offset++),
          reading_b: generateReading('air', 2, 'b', offset++)
        }
      },
      order4: {
        acetone: {
          reading_a: generateReading('acetone', 4, 'a', offset++),
          reading_b: generateReading('acetone', 4, 'b', offset++)
        },
        air: {
          reading_a: generateReading('air', 4, 'a', offset++),
          reading_b: generateReading('air', 4, 'b', offset++)
        }
      }
    });
  };

  const calculateTotalReading = (msr, vsr) => {
    if (msr === '' || vsr === '') return '';
    return (parseFloat(msr) + (parseFloat(vsr) * LEAST_COUNT)).toFixed(5);
  };

  const calculateDiameter = (l, r) => {
    if (!l || !r) return '';
    return Math.abs(parseFloat(r) - parseFloat(l)).toFixed(5);
  };

  const getCalculatedValues = () => {
    const results = { order2: { acetone: {}, air: {} }, order4: { acetone: {}, air: {} } };
    ['order2', 'order4'].forEach(order => {
      ['acetone', 'air'].forEach(medium => {
        ['reading_a', 'reading_b'].forEach(reading => {
          const data = readings[order][medium][reading];
          const leftTotal = calculateTotalReading(data.left_msr, data.left_vsr);
          const rightTotal = calculateTotalReading(data.right_msr, data.right_vsr);
          const diameter = calculateDiameter(leftTotal, rightTotal);
          results[order][medium][reading] = { leftTotal, rightTotal, diameter };
        });
      });
    });
    return results;
  };

  const calc = getCalculatedValues();

  const getMuForOrder = (order) => {
    const dAcetoneA = parseFloat(calc[order].acetone.reading_a.diameter);
    const dAcetoneB = parseFloat(calc[order].acetone.reading_b.diameter);
    const dAirA = parseFloat(calc[order].air.reading_a.diameter);
    const dAirB = parseFloat(calc[order].air.reading_b.diameter);

    if (dAcetoneA && dAcetoneB && dAirA && dAirB) {
      const meanDSqAcetone = (Math.pow(dAcetoneA, 2) + Math.pow(dAcetoneB, 2)) / 2;
      const meanDSqAir = (Math.pow(dAirA, 2) + Math.pow(dAirB, 2)) / 2;
      return (meanDSqAir / meanDSqAcetone).toFixed(5);
    }
    return null;
  };

  const mu2 = getMuForOrder('order2');
  const mu4 = getMuForOrder('order4');
  const finalMu = (mu2 && mu4) ? ((parseFloat(mu2) + parseFloat(mu4)) / 2).toFixed(5) : null;

  const renderTable = (order, label) => {
    const dAcetoneA = parseFloat(calc[order].acetone.reading_a.diameter);
    const dAcetoneB = parseFloat(calc[order].acetone.reading_b.diameter);
    const dAirA = parseFloat(calc[order].air.reading_a.diameter);
    const dAirB = parseFloat(calc[order].air.reading_b.diameter);

    let muAcetone = null;
    let muAir = null;

    if (dAcetoneA && dAcetoneB && dAirA && dAirB) {
      const meanDSqAcetone = (Math.pow(dAcetoneA, 2) + Math.pow(dAcetoneB, 2)) / 2;
      const meanDSqAir = (Math.pow(dAirA, 2) + Math.pow(dAirB, 2)) / 2;
      muAcetone = (meanDSqAir / meanDSqAcetone).toFixed(5);
      muAir = (meanDSqAir / meanDSqAcetone).toFixed(5);
    }

    return (
      <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Circle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-lg uppercase tracking-wider">Observation Table</div>
              <div className="text-sm text-slate-300">Order n = {label}</div>
            </div>
          </div>
          <div className="text-3xl font-black opacity-20">n={label}</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gradient-to-b from-gray-100 to-gray-50 text-gray-700">
              <tr>
                <th className="border-2 border-gray-300 p-3 font-bold" rowSpan="2">Medium New</th>
                <th className="border-2 border-gray-300 p-3 font-bold bg-blue-50" colSpan="4">Left Position (cm) - (a)</th>
                <th className="border-2 border-gray-300 p-3 font-bold bg-purple-50" colSpan="4">Right Position (cm) - (b)</th>
                <th className="border-2 border-gray-300 p-3 font-bold bg-pink-50" rowSpan="2">Medium<br/>μ</th>
              </tr>
              <tr className="text-xs">
                <th className="border-2 border-gray-300 p-2 bg-blue-50">MSR</th>
                <th className="border-2 border-gray-300 p-2 bg-blue-50">VSR</th>
                <th className="border-2 border-gray-300 p-2 bg-blue-100 font-bold">Total</th>
                <th className="border-2 border-gray-300 p-2 bg-yellow-100 font-bold">D²</th>
                <th className="border-2 border-gray-300 p-2 bg-purple-50">MSR</th>
                <th className="border-2 border-gray-300 p-2 bg-purple-50">VSR</th>
                <th className="border-2 border-gray-300 p-2 bg-purple-100 font-bold">Total</th>
                <th className="border-2 border-gray-300 p-2 bg-yellow-100 font-bold">D²</th>
              </tr>
            </thead>
            <tbody>
              {['acetone', 'air'].map((med, idx) => {
                const dSquaredA = calc[order][med].reading_a.diameter ? 
                  (Math.pow(parseFloat(calc[order][med].reading_a.diameter), 2)).toFixed(6) : '—';
                const dSquaredB = calc[order][med].reading_b.diameter ? 
                  (Math.pow(parseFloat(calc[order][med].reading_b.diameter), 2)).toFixed(6) : '—';
                
                return (
                  <tr key={med} className="hover:bg-gray-50 transition-colors">
                    <td className={`border-2 border-gray-300 p-3 text-center font-bold uppercase text-sm ${
                      med === 'air' 
                        ? 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-900' 
                        : 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900'
                    }`}>
                      {med}
                    </td>
                    {/* Left Position (a) */}
                    <td className="border-2 border-gray-300 p-2 text-center font-mono text-xs">
                      {readings[order][med].reading_a.left_msr}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono text-xs">
                      {readings[order][med].reading_a.left_vsr}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono font-semibold bg-blue-50 text-xs">
                      {calc[order][med].reading_a.leftTotal}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono font-bold bg-yellow-50 text-xs">
                      {dSquaredA}
                    </td>
                    {/* Right Position (b) */}
                    <td className="border-2 border-gray-300 p-2 text-center font-mono text-xs">
                      {readings[order][med].reading_b.right_msr}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono text-xs">
                      {readings[order][med].reading_b.right_vsr}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono font-semibold bg-purple-50 text-xs">
                      {calc[order][med].reading_b.rightTotal}
                    </td>
                    <td className="border-2 border-gray-300 p-2 text-center font-mono font-bold bg-yellow-50 text-xs">
                      {dSquaredB}
                    </td>
                    {/* Medium μ */}
                    {idx === 0 && (
                      <td className="border-2 border-gray-300 p-3 text-center font-mono font-black text-lg bg-gradient-to-br from-pink-50 to-rose-100 text-rose-900" rowSpan="2">
                        {muAcetone || '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Circle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                  NEWTON'S RINGS
                </h1>
                <p className="text-lg text-indigo-600 font-bold mt-1">
                  Refractive Index (μ) Determination
                </p>
              </div>
            </div>
            
            <button 
              onClick={generateRandomReadings} 
              className="flex gap-3 items-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-indigo-700"
            >
              <RefreshCw size={22} strokeWidth={2.5} />
              <span className="text-base">GENERATE READINGS</span>
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
              <div className="text-xs font-bold text-blue-700 uppercase mb-2">Radius of Curvature</div>
              <input
                type="number"
                step="0.1"
                value={radiusOfCurvature}
                onChange={(e) => setRadiusOfCurvature(parseFloat(e.target.value))}
                className="w-full text-2xl font-black text-blue-900 bg-transparent border-b-2 border-blue-300 focus:outline-none focus:border-blue-500 text-center"
              />
              <div className="text-xs text-blue-600 text-center mt-1">cm</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
              <div className="text-xs font-bold text-purple-700 uppercase mb-1">Least Count (LC)</div>
              <div className="text-2xl font-black text-purple-900">{LEAST_COUNT} cm</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
              <div className="text-xs font-bold text-green-700 uppercase mb-2">Light Source</div>
              <select
                value={selectedWavelength}
                onChange={(e) => setSelectedWavelength(e.target.value)}
                className="w-full text-sm font-bold text-green-900 bg-transparent border-b-2 border-green-300 focus:outline-none focus:border-green-500 p-1"
              >
                {Object.entries(wavelengthOptions).map(([key, data]) => (
                  <option key={key} value={key}>
                    {data.name} - {data.value} Å
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tables */}
        {renderTable('order2', '2')}
        {renderTable('order4', '4')}

        {/* Final Result */}
        {finalMu && (
          <div className="mt-10 p-10 bg-gradient-to-br from-white via-indigo-50 to-purple-50 border-4 border-indigo-500 rounded-3xl shadow-2xl text-center">
            <div className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm mb-4 shadow-lg">
              Final Experimental Result
            </div>
            <div className="text-2xl text-slate-700 font-bold mb-3">
              Mean Refractive Index of Acetone
            </div>
            <div className="mb-4 text-lg text-slate-600 font-mono">
              = (μ from Order 2 + μ from Order 4) / 2
            </div>
            <div className="mb-4 text-lg text-slate-600 font-mono">
              = ({mu2} + {mu4}) / 2
            </div>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-6xl font-black text-indigo-600">μ</div>
              <div className="text-6xl font-black text-slate-800">=</div>
              <div className="text-8xl font-mono font-black text-slate-900 bg-yellow-100 px-8 py-4 rounded-2xl border-4 border-yellow-300 shadow-lg">
                {finalMu}
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-slate-500 italic">
          Each student receives unique readings based on timestamp • LC = {LEAST_COUNT} cm
        </div>
      </div>
    </div>
  );
}