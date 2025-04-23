import React, { useRef, useState, useEffect } from "react";

export default function PolygonDrawer() {
  const canvasRef = useRef(null);
  const [polygons, setPolygons] = useState([]); // array of {points: [], color: "#hex"}
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState(false);
  const [currentColor, setCurrentColor] = useState("#0096ff");
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [hoveredPolygonIndex, setHoveredPolygonIndex] = useState(null);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isPolygonClosed) {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    } else {
      const clickedIndex = polygons.findIndex(({ points }) => isPointInPolygon({ x, y }, points));
      if (clickedIndex !== -1) {
        setSelectedPolygonIndex(clickedIndex);
      } else {
        setSelectedPolygonIndex(null);
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredIndex = polygons.findIndex(({ points }) => isPointInPolygon({ x, y }, points));
    setHoveredPolygonIndex(hoveredIndex !== -1 ? hoveredIndex : null);
  };

  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
                        (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const drawAllPolygons = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    polygons.forEach(({ points, color }, index) => {
      if (points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = selectedPolygonIndex === index ? 'black' : (hoveredPolygonIndex === index ? 'orange' : 'gray');
      ctx.lineWidth = selectedPolygonIndex === index || hoveredPolygonIndex === index ? 2 : 1;
      ctx.stroke();
    });

    if (currentPoints.length > 0 && !isPolygonClosed) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  };

  const fillPolygon = () => {
    if (currentPoints.length < 3) return alert("Need at least 3 points");
    setPolygons((prev) => [...prev, { points: currentPoints, color: currentColor }]);
    setCurrentPoints([]);
    setIsPolygonClosed(false);
  };

  const changeSelectedPolygonColor = (color) => {
    if (selectedPolygonIndex === null) return;
    setPolygons((prev) => {
      const updated = [...prev];
      updated[selectedPolygonIndex] = {
        ...updated[selectedPolygonIndex],
        color
      };
      return updated;
    });
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPolygons([]);
    setCurrentPoints([]);
    setIsPolygonClosed(false);
    setSelectedPolygonIndex(null);
  };

  const undoLastPoint = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawAllPolygons(ctx);
  }, [polygons, currentPoints, selectedPolygonIndex, hoveredPolygonIndex]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="border border-gray-400 rounded-lg shadow"
      />

      {polygons.length > 0 && currentPoints.length === 0 && selectedPolygonIndex === null && (
        <p className="text-gray-600">Click to select a polygon</p>
      )}

      <div className="flex gap-2 items-center">
        <label className="flex items-center gap-2">
          <span>{selectedPolygonIndex !== null ? "Change Color:" : "Pick Color:"}</span>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              setCurrentColor(e.target.value);
              if (selectedPolygonIndex !== null) {
                changeSelectedPolygonColor(e.target.value);
              }
            }}
            className="w-10 h-10 border rounded"
          />
        </label>
        <button
          onClick={fillPolygon}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Finish Polygon
        </button>
        <button
          onClick={undoLastPoint}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Undo Point
        </button>
        <button
          onClick={resetCanvas}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reset
        </button>
      </div>

      <div className="w-full max-w-2xl mt-4">
        <h2 className="text-lg font-bold mb-2">Polygon List:</h2>
        <ul className="bg-white shadow rounded p-4 divide-y divide-gray-200">
          {polygons.map((poly, index) => (
            <li
              key={index}
              onClick={() => setSelectedPolygonIndex(index)}
              className={`flex justify-between items-center py-2 cursor-pointer ${selectedPolygonIndex === index ? 'bg-gray-100' : ''}`}
            >
              <span>Polygon #{index + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{poly.points.length} points</span>
                <div className="w-6 h-6 rounded border" style={{ backgroundColor: poly.color }}></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
