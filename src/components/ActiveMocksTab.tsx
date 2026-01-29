import { useState, useRef } from 'react';
import type { LocalStorageItem } from '../types';
import { LocalStorageItemComponent } from './LocalStorageItem';
import { FloatingNavigationMenu } from './FloatingNavigationMenu';

type SectionId = 'analytics' | 'evaluations';

interface ActiveMocksTabProps {
  items: LocalStorageItem[];
  currentTab: string;
  searchTerm: string;
  loading: boolean;
  error?: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onSaveItem: (key: string, item: LocalStorageItem) => Promise<void>;
  onReload: () => Promise<void>;
}

interface MocksSectionProps {
  id: SectionId;
  title: string;
  items: LocalStorageItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  searchTerm: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onSaveItem: (key: string, item: LocalStorageItem) => Promise<void>;
}

function MocksSection({ id, title, items, isCollapsed, onToggle, sectionRef, searchTerm, onUpdateItem, onDeleteItem, onSaveItem }: MocksSectionProps): React.ReactNode {
  if (items.length === 0) return null;

  return (
    <div className="mocks-section" ref={sectionRef} data-section-id={id}>
      <div className="section-header-wrapper">
        <button
          className="section-header-button"
          onClick={onToggle}
          data-tooltip={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
          <h3 className="section-header">{title}</h3>
          <div className="items-count">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </button>
      </div>

      {!isCollapsed && (
        <div className="items-list">
          {items.map((item) => (
            <LocalStorageItemComponent
              key={item.key}
              item={item}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onSave={onSaveItem}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ActiveMocksTab({
  items,
  currentTab,
  searchTerm,
  loading,
  error,
  onUpdateItem,
  onDeleteItem,
  onSaveItem,
  onReload
}: ActiveMocksTabProps): React.ReactNode {
  const analyticsRef = useRef<HTMLDivElement>(null);
  const evaluationsRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(new Set());

  const toggleSection = (sectionId: SectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isCollapsed = (sectionId: SectionId): boolean => {
    return collapsedSections.has(sectionId);
  };

  const scrollToSection = (sectionId: SectionId) => {
    const ref = sectionId === 'analytics' ? analyticsRef : evaluationsRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading localStorage items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onReload} className="retry-btn" data-tooltip="Retry loading active mocks">
          Try Again
        </button>
      </div>
    );
  }

  const analyticsMocks = items.filter(item => !item.mockParts?.isTimeless);
  const evaluationsMocks = items.filter(item => item.mockParts?.isTimeless);

  return (
    <div className="tab-content">
      {items.length === 0 ? (
        <div className="no-items">
          <p>No localStorage mock items found{searchTerm && ` matching "${searchTerm}"`}</p>
          <p>Make sure you're on a page that has localStorage items with the "mock_" prefix.</p>
        </div>
      ) : (
        <>
          <div>
            <MocksSection
              id="analytics"
              title="Analytics"
              items={analyticsMocks}
              isCollapsed={isCollapsed('analytics')}
              onToggle={() => toggleSection('analytics')}
              sectionRef={analyticsRef}
              searchTerm={searchTerm}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onSaveItem={onSaveItem}
            />
            <MocksSection
              id="evaluations"
              title="Evaluations"
              items={evaluationsMocks}
              isCollapsed={isCollapsed('evaluations')}
              onToggle={() => toggleSection('evaluations')}
              sectionRef={evaluationsRef}
              searchTerm={searchTerm}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onSaveItem={onSaveItem}
            />
          </div>

          <FloatingNavigationMenu
            sections={[
              { id: 'analytics', title: 'Analytics', count: analyticsMocks.length },
              { id: 'evaluations', title: 'Evaluations', count: evaluationsMocks.length }
            ]}
            onNavigate={(id) => scrollToSection(id as SectionId)}
          />
        </>
      )}
      <div className="current-tab">
        <small>Current tab: {currentTab}</small>
      </div>
    </div>
  );
}
