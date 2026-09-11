import React, { useEffect, useMemo, useState } from "react";

const CountrySearch = ({ countries, value, onChange }) => {
  const selected = countries.find((item) => item.code === value);
  const [query, setQuery] = useState(selected?.name || "");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return countries.slice(0, 8);
    return countries.filter((item) => item.name.toLocaleLowerCase().includes(term) || item.code.toLocaleLowerCase() === term).slice(0, 8);
  }, [countries, query]);

  useEffect(() => { if (selected) setQuery(selected.name); }, [value, selected]);
  const choose = (item) => { onChange(item.code); setQuery(item.name); setOpen(false); };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && open && results[0]) { event.preventDefault(); choose(results[0]); }
    if (event.key === "Escape") setOpen(false);
  };

  return <div className="country-search"><input role="combobox" aria-label="Search country" aria-expanded={open} aria-controls="country-results" value={query} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onKeyDown={handleKeyDown} onChange={(event) => { setQuery(event.target.value); onChange(""); setOpen(true); }} placeholder="Type a country…" autoComplete="off"/>{open && <div className="country-results" id="country-results" role="listbox">{results.length ? results.map((item) => <button type="button" role="option" aria-selected={item.code === value} key={item.code} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}><span>{item.flag}</span>{item.name}<small>{item.code}</small></button>) : <p>No country found</p>}</div>}</div>;
};

export default CountrySearch;
