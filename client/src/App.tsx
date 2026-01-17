import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Chat } from './components/Chat';

interface DataPoint {
  model: string;
  scenario: string;
  region: string;
  variable: string;
  item: string;
  unit: string;
  year: number;
  value: number;
}

export default function App() {
  const [rawData, setRawData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedVariable, setSelectedVariable] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  useEffect(() => {
    fetch('http://localhost:8000/api/data')
      .then(res => res.json())
      .then(data => {
        setRawData(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedRegion(first.region);
          setSelectedVariable(first.variable);
          setSelectedItem(first.item);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(() => [...new Set(rawData.map(d => d.region))], [rawData]);
  const variables = useMemo(() => {
    return [...new Set(
      rawData
        .filter(d => d.region === selectedRegion)
        .map(d => d.variable)
    )];
  }, [rawData, selectedRegion]);
  const items = useMemo(() => {
    return [...new Set(
      rawData
        .filter(d => d.region === selectedRegion && d.variable === selectedVariable)
        .map(d => d.item)
    )];
  }, [rawData, selectedRegion, selectedVariable]);

  useEffect(() => {
    if (selectedRegion && !variables.includes(selectedVariable)) {
      setSelectedVariable(variables[0] || "");
    }
  }, [selectedRegion, variables]);

  useEffect(() => {
    if (selectedVariable && !items.includes(selectedItem)) {
      setSelectedItem(items[0] || "");
    }
  }, [selectedVariable, items]);

  const chartData = useMemo(() => {
    const data = rawData.filter(d => 
      d.region === selectedRegion && 
      d.variable === selectedVariable &&
      d.item === selectedItem
    );
    return data.sort((a, b) => a.year - b.year);
  }, [rawData, selectedRegion, selectedVariable, selectedItem]);

  const currentUnit = useMemo(() => {
    if (chartData.length > 0) {
      return chartData[0].unit;
    }
    return "";
  }, [chartData]);

  if (loading) return <div className="p-10">Loading data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-700"> IIASA Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Region</label>
              <select 
                className="border p-2 rounded w-40"
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Variable</label>
              <select 
                className="border p-2 rounded w-60"
                value={selectedVariable}
                onChange={e => setSelectedVariable(e.target.value)}
              >
                {variables.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Item</label>
              <select 
              className="border p-2 rounded w-40"
              value={selectedItem}
              onChange={e => setSelectedItem(e.target.value)}
              >
              {items.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-112.5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {selectedVariable} <span className="text-slate-400">/</span> {selectedItem}
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium border border-indigo-100">
                Unit: {currentUnit || "N/A"}
              </span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                Region: {selectedRegion}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="year" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tickFormatter={(tick) => tick.toString()} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 7 }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-slate-400 mt-2">
              Showing {chartData.length} data points filtered from {rawData.length} total records.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Geospatial Layer</h2>
            <div className="bg-slate-900 rounded-lg overflow-hidden h-96 flex items-center justify-center relative">
              <img 
                src="http://localhost:8000/api/map" 
                alt="Raster Data" 
                className="w-full h-full object-contain opacity-90"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Full Global Extent
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Downscaled server-side for performance.
            </p>
          </div>
        </div>
      </div>
      <Chat
        context={{
          region: selectedRegion,
          variable: selectedVariable,
          item: selectedItem,
        }}
      />
    </div>
  );
}