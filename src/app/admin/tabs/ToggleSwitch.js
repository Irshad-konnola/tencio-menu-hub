'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function ToggleSwitch({ isOn, onToggle }) {
  return (
    <div onClick={onToggle} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${isOn ? "bg-[#111814]" : "bg-neutral-200"}`}>
      <motion.div className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: isOn ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </div>
  );
}
