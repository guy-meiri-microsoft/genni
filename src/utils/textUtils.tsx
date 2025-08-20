export const highlightText = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="search-highlight">{part}</mark>
    ) : part
  );
};
