import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';

export interface SelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
  extraBadge?: string;
  raw?: any;
}

interface AsyncSelect2Props {
  value: number | string | null | undefined;
  onChange: (value: number | string, option?: SelectOption) => void;
  loadOptions: (
    search: string,
    page: number
  ) => Promise<{ data: SelectOption[]; hasMore: boolean }>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  initialOption?: SelectOption | null;
  style?: React.CSSProperties;
  className?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const AsyncSelect2: React.FC<AsyncSelect2Props> = ({
  value,
  onChange,
  loadOptions,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  required = false,
  initialOption = null,
  style,
  className = '',
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(initialOption);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync initialOption if provided
  useEffect(() => {
    if (initialOption) {
      setSelectedOption(initialOption);
    }
  }, [initialOption]);

  // If value is empty or cleared, reset selected option
  useEffect(() => {
    if (!value && value !== 0) {
      setSelectedOption(null);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial or searched batch
  const fetchOptions = useCallback(
    async (searchQuery: string, pageNum: number) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await loadOptions(searchQuery, pageNum);
        if (pageNum === 1) {
          setOptions(res.data);
        } else {
          setOptions((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const newUnique = res.data.filter((o) => !existingIds.has(o.id));
            return [...prev, ...newUnique];
          });
        }
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('Error fetching options in AsyncSelect2:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadOptions]
  );

  // When dropdown opens, focus search input and load page 1 if empty
  const handleOpen = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      if (options.length === 0 || searchTerm !== '') {
        setSearchTerm('');
        setPage(1);
        fetchOptions('', 1);
      }
    }
  };

  // Search input handler with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toUpperCase();
    setSearchTerm(query);
    setPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchOptions(query, 1);
    }, 280);
  };

  // Infinite scroll listener inside dropdown list
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      !loading &&
      !loadingMore &&
      hasMore &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 30
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOptions(searchTerm, nextPage);
    }
  };

  const handleSelect = (opt: SelectOption) => {
    setSelectedOption(opt);
    onChange(opt.id, opt);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange('');
  };

  return (
    <div
      ref={containerRef}
      className={`async-select2-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          required={required}
          value={value ? String(value) : ''}
          onChange={() => {}}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Trigger Box */}
      <div
        onClick={handleOpen}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '8px 12px',
          minHeight: '40px',
          background: disabled ? '#f1f5f9' : '#ffffff',
          borderColor: isOpen ? 'var(--primary-color)' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span
                style={{
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {selectedOption.label}
              </span>
              {selectedOption.extraBadge && (
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedOption.extraBadge}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
              }}
              title="Limpiar selección"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            style={{
              color: '#64748b',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 10005,
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0 8px',
              }}
            >
              <Search size={16} style={{ color: '#94a3b8', marginRight: '6px' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '6px 0',
                  fontSize: '0.85rem',
                  width: '100%',
                  background: 'transparent',
                }}
              />
              {loading && <Loader2 size={16} className="spin" style={{ color: 'var(--primary-color)' }} />}
            </div>
          </div>

          {/* Options List with Infinite Scroll */}
          <div
            onScroll={handleScroll}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {options.length === 0 && !loading ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem',
                }}
              >
                No se encontraron resultados
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = String(value) === String(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {renderOption ? (
                      renderOption(opt)
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? 'var(--primary-color)' : '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {opt.label}
                          </span>
                          {opt.extraBadge && (
                            <span
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              {opt.extraBadge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    )}
                    {isSelected && <Check size={16} color="var(--primary-color)" style={{ marginLeft: '8px' }} />}
                  </div>
                );
              })
            )}

            {loadingMore && (
              <div
                style={{
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#64748b',
                  fontSize: '0.78rem',
                }}
              >
                <Loader2 size={14} className="spin" />
                <span>Cargando más resultados...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
