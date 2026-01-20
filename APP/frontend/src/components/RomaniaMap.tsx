import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";


const GEO_URL = "/romania.json"; //aici e fisierul cu toate coordonatele pentru harta

interface RomaniaMapProps {
  onSelect: (countyName: string) => void;
  onClose: () => void;
}

const RomaniaMap: React.FC<RomaniaMapProps> = ({ onSelect, onClose }) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative border border-gray-200">
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Select County</h2>
            <p className="text-sm text-gray-500">Click on your county to auto-fill the city field</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="w-full h-[500px] border border-gray-100 rounded-2xl overflow-hidden bg-slate-50 relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 5000,
              center: [25, 46], 
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countyName = geo.properties.name || geo.properties.NAME_1;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setTooltipContent(countyName);
                      }}
                      onMouseMove={(e: React.MouseEvent) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      onClick={() => {
                        if (countyName) {
                          onSelect(countyName);
                          onClose();
                        }
                      }}
                      style={{
                        default: {
                          fill: "#f08a5d",
                          stroke: "#FFFFFF",
                          strokeWidth: 1,
                          outline: "none",
                        },
                        hover: {
                          fill: "#f9ed69",
                          stroke: "#FFFFFF",
                          strokeWidth: 2,
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#ec4899",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {tooltipContent && (
            <div 
              className="fixed pointer-events-none z-[110] bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl border border-white/20 animate-in fade-in zoom-in duration-150"
              style={{ 
                left: tooltipPos.x + 15, 
                top: tooltipPos.y - 40 
              }}
            >
              {tooltipContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RomaniaMap;