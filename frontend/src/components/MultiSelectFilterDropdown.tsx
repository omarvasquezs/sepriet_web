import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FilterOption {
  id: number;
  name: string;
  badgeClass?: string;
  dotColor?: string;
}

interface MultiSelectFilterDropdownProps {
  title: string;
  labelPrefix: string;
  options: FilterOption[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  style?: React.CSSProperties;
}

export const MultiSelectFilterDropdown: React.FC<MultiSelectFilterDropdownProps> = ({
  title,
  labelPrefix,
  options,
  selectedIds,
  onChange,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const isFiltering = selectedIds.length > 0 && selectedIds.length < options.length;

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(options.map(opt => opt.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Label text calculation
  let labelText = `${labelPrefix}: Todos`;
  if (selectedIds.length > 0 && selectedIds.length < options.length) {
    const selectedNames = options
      .filter(opt => selectedIds.includes(opt.id))
      .map(opt => opt.name);

    if (selectedNames.length === 1) {
      labelText = `${labelPrefix}: ${selectedNames[0]}`;
    } else if (selectedNames.length === 2) {
      labelText = `${labelPrefix}: ${selectedNames[0]}, ${selectedNames[1]}`;
    } else {
      labelText = `${labelPrefix}: ${selectedNames[0]}, ${selectedNames[1]} (+${selectedNames.length - 2})`;
    }
  }

  return (
    <div
      ref={containerRef}
      className="multiselect-filter-container"
      style={{ position: 'relative', flex: 1, minWidth: '180px', ...style }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`form-select multiselect-trigger ${isFiltering ? 'active-filter' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          cursor: 'pointer',
          textAlign: 'left',
          background: isFiltering ? '#f0fdf4' : '#ffffff',
          borderColor: isFiltering ? '#86efac' : 'var(--border-color)',
          fontWeight: isFiltering ? 600 : 500,
          paddingRight: '10px',
        }}
        title={`Filtrar por ${title}`}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: '6px',
            color: isFiltering ? '#15803d' : 'inherit',
          }}
        >
          {labelText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isFiltering && (
            <span
              className="multiselect-count-badge"
              style={{
                background: '#22c55e',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '1px 6px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {selectedIds.length}
            </span>
          )}

          {isFiltering && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                color: '#64748b',
                cursor: 'pointer',
              }}
              title="Quitar filtros"
            >
              <X size={14} />
            </span>
          )}

          <ChevronDown
            size={15}
            color={isFiltering ? '#16a34a' : '#64748b'}
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className="multiselect-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            minWidth: '240px',
            width: '100%',
            maxWidth: '320px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'modalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              {title}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4f46e5',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Todos
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Options Checklist */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '6px' }}>
            {options.map((option) => {
              const isChecked = selectedIds.includes(option.id);
              return (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontWeight: isChecked ? 600 : 500,
                    color: isChecked ? '#0f172a' : '#475569',
                    background: isChecked ? '#f0fdf4' : 'transparent',
                    transition: 'background 0.15s ease',
                    marginBottom: '2px',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(option.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#16a34a',
                      cursor: 'pointer',
                    }}
                  />

                  {option.dotColor && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: option.dotColor,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <span style={{ flex: 1 }}>{option.name}</span>

                  {isChecked && (
                    <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                  )}
                </label>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <span>
              {selectedIds.length === 0
                ? 'Mostrando todos'
                : `${selectedIds.length} de ${options.length} seleccionados`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-secondary"
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
