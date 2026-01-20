import { useState } from 'react';

interface NavigationSection {
  id: string;
  title: string;
  count: number;
}

interface FloatingNavigationMenuProps {
  sections: NavigationSection[];
  onNavigate: (sectionId: string) => void;
}

export function FloatingNavigationMenu({ sections, onNavigate }: FloatingNavigationMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId);
    setIsOpen(false); // Close menu after navigation
  };

  // Only show sections that have items
  const visibleSections = sections.filter(s => s.count > 0);

  // Don't render if no sections or only one section
  if (visibleSections.length <= 1) return <></>;

  return (
    <div className="floating-nav-container">
      <button
        className={`floating-nav-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip="Jump to section"
        aria-label="Section navigation"
      >
        ☰
      </button>

      {isOpen && (
        <>
          <div className="floating-nav-backdrop" onClick={() => setIsOpen(false)} />
          <div className="floating-nav-menu">
            <div className="floating-nav-header">
              <span>Jump to section</span>
              <button
                className="floating-nav-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <ul className="floating-nav-list">
              {visibleSections.map(section => (
                <li key={section.id}>
                  <button
                    className="floating-nav-item"
                    onClick={() => handleNavigate(section.id)}
                  >
                    <span className="nav-item-title">{section.title}</span>
                    <span className="nav-item-count">{section.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
