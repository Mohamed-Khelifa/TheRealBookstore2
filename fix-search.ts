import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the performSearch logic
const searchLogic = `const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      setIsSearchDropdownOpen(true);
      try {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, price, old_price, cover_image_url, is_bundle, bundle_books, categories')
          .or(\`title.ilike.%\${searchQuery}%,author.ilike.%\${searchQuery}%\`)
          .limit(5);
          
        if (data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };`;

code = code.replace(/const performSearch = async \(\) => \{[\s\S]*?\}\;\n\n    const timer = setTimeout\(performSearch, 300\);/m, `${searchLogic}\n\n    const timer = setTimeout(performSearch, 300);`);

// Remove allBooksCache completely
code = code.replace(/const \[allBooksCache, setAllBooksCache\] = useState<any\[\]>\(\[\]\);\n/, '');
code = code.replace(/, allBooksCache/, ''); // in useEffect dependency array

fs.writeFileSync('src/App.tsx', code);
