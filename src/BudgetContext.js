import React, { createContext, useState } from 'react';

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState({
    Work: 20, // Default values
    Sleep: 60,
    Relax: 20,
  });

  const assignBudget = (newBudgets) => {
    setBudgets(newBudgets);
  };

  return (
    <BudgetContext.Provider value={{ budgets, assignBudget }}>
      {children}
    </BudgetContext.Provider>
  );
};