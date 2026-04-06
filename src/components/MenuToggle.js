import React from "react";
import { motion } from "framer-motion";

/**
 * Кнопка-переключатель меню (гамбургер)
 */
const MenuToggle = ({ isOpen, onClick }) => (
  <motion.button
    className="menu-toggle"
    onClick={onClick}
    whileTap={{ scale: 0.9 }}
    aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
  >
    <span className={`line line-1 ${isOpen ? "open" : ""}`} />
    <span className={`line line-2 ${isOpen ? "open" : ""}`} />
    <span className={`line line-3 ${isOpen ? "open" : ""}`} />
  </motion.button>
);

export default MenuToggle;
