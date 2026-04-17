/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function App() {
  const [items, setItems] = useState('1,2,3,4,5,6,7,8,9,10');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const savedHistory = localStorage.getItem('drawHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveWinner = (newWinner: string) => {
    const newHistory = [newWinner, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('drawHistory', JSON.stringify(newHistory));
  };

  const itemList = items.split(',').map((item) => item.trim()).filter((item) => item !== '');

  const drawSpinner = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    const sectorAngle = (2 * Math.PI) / itemList.length;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'];

    itemList.forEach((item, index) => {
      const startAngle = angle + index * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sectorAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(item, radius - 10, 10);
      ctx.restore();
    });
  }, [itemList]);

  useEffect(() => {
    drawSpinner(0);
  }, [drawSpinner]);

  const spin = () => {
    setIsSpinning(true);
    setWinner(null);
    velocityRef.current = Math.random() * 0.2 + 0.3; // Random initial speed
  };

  useEffect(() => {
    if (!isSpinning) return;

    const animate = () => {
      rotationRef.current += velocityRef.current;
      velocityRef.current *= 0.985; // Friction

      drawSpinner(rotationRef.current);

      if (velocityRef.current > 0.001) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Determine winner
        const normalizedAngle = ((-rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const sectorAngle = (2 * Math.PI) / itemList.length;
        const winnerIndex = Math.floor(normalizedAngle / sectorAngle);
        const win = itemList[winnerIndex];
        setWinner(win);
        saveWinner(win);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      }
    };

    animate();
  }, [isSpinning, drawSpinner, itemList]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Lucky Draw Spinner</h1>
      
      <div className="mb-4 w-full max-w-md">
        <input
          type="text"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter items separated by comma"
          disabled={isSpinning}
        />
      </div>

      <div className="relative">
        <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 z-10" />
        <canvas ref={canvasRef} width={400} height={400} className="bg-white rounded-full shadow-lg" />
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-full text-xl hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {isSpinning ? 'Spinning...' : 'Start Draw'}
      </button>

      {history.length > 0 && (
        <div className="mt-8 w-full max-w-md bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">History</h3>
          <ul className="list-disc list-inside">
            {history.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {winner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Congratulations! 🎉</h2>
            <p className="text-6xl font-extrabold text-blue-600">{winner}</p>
            <button
              onClick={() => setWinner(null)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

