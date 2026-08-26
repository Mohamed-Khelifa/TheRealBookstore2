import fs from 'fs';

let content = fs.readFileSync('src/pages/Categories.tsx', 'utf-8');

// Replace the fetch logic
const fetchMatch = `useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setBooks(data);
    };
    fetchBooks();
    window.scrollTo(0, 0);
  }, []);`;

const newFetch = `  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchBooks = async () => {
      // Keep books for counting just out of recent, but it's not fully accurate. To avoid showing '0 Books', we can just hide it for dynamic cats
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setBooks(data);
      
      const { data: catData } = await supabase.from('books').select('categories');
      if (catData) {
        const languageCategories = ['English', 'French', 'Arabic', 'Français', 'Francais', 'العربية', 'Anglais', 'Manga', 'manga', 'Algerian', 'Algerien', 'Algérien', 'DZ', 'dz', 'الجزائر'];
        const extracted = Array.from(new Set(catData.flatMap(b => b.categories || [])))
          .filter(c => c !== 'Featured' && c !== 'Most Popular' && c !== 'Trendiest' && c !== 'Personal Development' && !languageCategories.includes(c));
        
        const sorted = [...extracted].sort((a, b) => {
          const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography'];
          const aIndex = famousGenres.indexOf(a);
          const bIndex = famousGenres.indexOf(b);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.localeCompare(b);
        });
        setDynamicCategories(sorted);
      }
    };
    fetchBooks();
    window.scrollTo(0, 0);
  }, []);`;

content = content.replace(fetchMatch, newFetch);

const oldCategoriesMatch = `const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography', 'Philosophy'];
  const categories = Array.from(new Set((Array.isArray(books) ? books : []).flatMap(b => (b as any).categories || [])))
    .filter(c => c !== 'Featured' && c !== 'Most Popular' && c !== 'Trendiest' && c !== 'Personal Development');
    
  const sortedCategories = [...categories].sort((a, b) => {
    const aIndex = famousGenres.indexOf(a);
    const bIndex = famousGenres.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  
  const allCategories = ['All', 'Featured', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', ...sortedCategories];`;

const newCategoriesMatch = `  const fixedCategoriesSet = new Set(['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Featured', 'Classics', 'Philosophy']);
  const filteredDynamic = dynamicCategories.filter(c => !fixedCategoriesSet.has(c));
  const allCategories = ['All', 'Featured', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy', ...filteredDynamic];`;

content = content.replace(oldCategoriesMatch, newCategoriesMatch);

content = content.replace(
  /\{bookCount\} \{bookCount === 1 \? 'Book' : 'Books'\}/,
  "{bookCount > 0 ? `${bookCount} ${bookCount === 1 ? 'Book' : 'Books'}` : 'View Collection'}"
);

fs.writeFileSync('src/pages/Categories.tsx', content);

