import React from 'react';
import { Wallet, Receipt, Users, Package, BarChart3, ShoppingBag } from 'lucide-react';

export type AppTab = 'cash_counter' | 'orders' | 'sales' | 'khata' | 'purchases' | 'reports';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenNewSale: () => void;
  pendingCustomerCount: number;
  pendingOrderCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingCustomerCount,
  pendingOrderCount,
}) => {
  const tabs = [
    {
      id: 'cash_counter' as const,
      label: 'Counter',
      labelHindi: 'गल्ला',
      icon: Wallet,
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      labelHindi: 'ऑर्डर',
      icon: ShoppingBag,
      badge: pendingOrderCount > 0 ? pendingOrderCount : undefined,
      badgeColor: 'bg-sky-600',
    },
    {
      id: 'sales' as const,
      label: 'Bills',
      labelHindi: 'बिक्री बिल',
      icon: Receipt,
    },
    {
      id: 'khata' as const,
      label: 'Khata',
      labelHindi: 'खाता',
      icon: Users,
      badge: pendingCustomerCount > 0 ? pendingCustomerCount : undefined,
      badgeColor: 'bg-rose-600',
    },
    {
      id: 'purchases' as const,
      label: 'Kharidari',
      labelHindi: 'खर्च',
      icon: Package,
    },
    {
      id: 'reports' as const,
      label: 'Summary',
      labelHindi: 'हिसाब',
      icon: BarChart3,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg px-1 sm:px-2 py-1 select-none">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              id={`tab-btn-${t.id}`}
              onClick={() => onSelectTab(t.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-0.5 rounded-xl transition relative min-w-0 ${
                isActive ? 'text-amber-700 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {t.badge && (
                  <span
                    className={`absolute -top-1 -right-2 w-4 h-4 ${
                      t.badgeColor || 'bg-rose-600'
                    } text-white rounded-full text-[9px] font-bold flex items-center justify-center`}
                  >
                    {t.badge > 9 ? '9+' : t.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] sm:text-[10px] mt-0.5 leading-tight tracking-tight text-center whitespace-nowrap truncate max-w-full">
                {t.label}
              </span>
              <span className="text-[8.5px] sm:text-[9px] text-stone-400 font-normal leading-none whitespace-nowrap truncate max-w-full">
                {t.labelHindi}
              </span>

              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-amber-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
