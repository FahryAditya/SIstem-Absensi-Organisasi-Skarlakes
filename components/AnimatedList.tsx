import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEventHandler, UIEvent } from 'react';

// Detect if we should reduce/skip animations (mobile or prefers-reduced-motion)
function useReducedAnimation() {
  const [reduced, setReduced] = useState(true); // default true (SSR safe)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isMobile = window.innerWidth < 1024 || ('ontouchstart' in window);
    setReduced(isMobile || mq.matches);
    const handler = () => setReduced(isMobile || mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  reduced?: boolean;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, index, onMouseEnter, onClick, className = '', reduced = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    if (reduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`mb-1 cursor-pointer ${className}`}
      style={reduced ? undefined : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: visible ? `opacity 0.25s ease ${delay}s, transform 0.25s ease ${delay}s` : 'none',
      }}
    >
      {children}
    </div>
  );
};

interface AnimatedListProps<T> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  selectedIndex?: number;
}

const AnimatedList = <T,>({
  items = [],
  onItemSelect,
  renderItem,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  listClassName = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  selectedIndex: controlledSelectedIndex
}: AnimatedListProps<T>) => {
  const reduced = useReducedAnimation();
  const listRef = useRef<HTMLDivElement>(null);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(initialSelectedIndex);
  
  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;
  const setSelectedIndex = useCallback((index: number) => {
    if (controlledSelectedIndex === undefined) {
      setInternalSelectedIndex(index);
    }
  }, [controlledSelectedIndex]);

  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, [setSelectedIndex]);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect, setSelectedIndex]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 30, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 30, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(Math.min(selectedIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation, setSelectedIndex]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (selectedItem) {
      const extraMargin = 40;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`relative flex flex-col h-full w-full ${className}`}>
      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto px-1 py-2 ${listClassName} ${
          displayScrollbar
            ? 'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'
            : 'scrollbar-hide'
        }`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
        }}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={reduced ? 0 : index * 0.03}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
            className={itemClassName}
            reduced={reduced}
          >
            {renderItem ? (
              renderItem(item, index, selectedIndex === index)
            ) : (
              <div className={`p-3 bg-white/5 rounded-lg border border-white/5 transition-colors ${selectedIndex === index ? 'bg-white/10 border-white/10' : ''}`}>
                <p className="text-white text-sm m-0">{String(item)}</p>
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#011025] to-transparent pointer-events-none transition-opacity duration-300 z-10"
            style={{ opacity: topGradientOpacity }}
          ></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#011025] to-transparent pointer-events-none transition-opacity duration-300 z-10"
            style={{ opacity: bottomGradientOpacity }}
          ></div>
        </>
      )}
    </div>
  );
};

export default AnimatedList;

