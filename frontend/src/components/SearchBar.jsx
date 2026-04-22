/**
 * components/SearchBar.jsx
 * Campo de busca com validação de ticker, suporte a Enter e loading state
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue]     = useState('');
  const [error, setError]     = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus ao montar
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e) => {
    // Força maiúsculas e remove caracteres inválidos
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setValue(raw);
    setError('');
  };

  const validate = (ticker) => {
    if (!ticker) return 'Digite o código de uma ação (ex: PETR4)';
    if (ticker.length < 4) return 'Ticker deve ter ao menos 4 caracteres';
    if (ticker.length > 7) return 'Ticker deve ter no máximo 7 caracteres';
    return '';
  };

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    onSearch(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setValue(''); setError(''); }
  };

  const handleClear = () => {
    setValue('');
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="searchbar-wrapper">
      <div className={`searchbar-container ${focused ? 'focused' : ''} ${error ? 'has-error' : ''}`}>
        {/* Ícone de busca */}
        <div className="searchbar-icon">
          {loading
            ? <Loader2 size={20} className="search-spinner" />
            : <Search size={20} />
          }
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Digite o ticker... ex: PETR4"
          className="searchbar-input mono"
          maxLength={7}
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          aria-label="Código da ação"
        />

        {/* Contador de caracteres */}
        {value && (
          <span className="char-count mono">{value.length}/7</span>
        )}

        {/* Botão limpar */}
        {value && !loading && (
          <button className="clear-btn" onClick={handleClear} aria-label="Limpar">
            <X size={16} />
          </button>
        )}

        {/* Divisor */}
        <div className="searchbar-divider" />

        {/* Botão buscar */}
        <button
          className="search-btn"
          onClick={handleSubmit}
          disabled={loading || !value}
          aria-label="Analisar ação"
        >
          {loading ? 'Analisando...' : 'Analisar →'}
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="searchbar-error animate-fade-in">{error}</p>
      )}

      {/* Dica */}
      {!error && (
        <p className="searchbar-hint">
          Pressione <kbd>Enter</kbd> para analisar · <kbd>Esc</kbd> para limpar
        </p>
      )}
    </div>
  );
}
