// components/ui/Tabs.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

// Context
const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs component
export const Tabs: React.FC<TabsProps> = ({ 
  defaultValue, 
  children, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      inline-flex h-10 items-center justify-center rounded-lg 
      bg-[var(--color-muted)] p-1 text-[var(--color-muted-foreground)]
      ${className}
    `}>
      {children}
    </div>
  );
};

// TabsTrigger component
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className = '',
  disabled = false 
}) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`
        inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 
        text-sm font-medium ring-offset-[var(--color-background)] 
        transition-all focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        border-b-2 -mb-px relative
        ${isActive 
          ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold' 
          : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border)]'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// TabsContent component
export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const { activeTab } = useTabs();
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={`
      mt-2 ring-offset-[var(--color-background)] 
      focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2
      ${className}
    `}>
      {children}
    </div>
  );
};

// Export all components as named exports
export default Tabs;