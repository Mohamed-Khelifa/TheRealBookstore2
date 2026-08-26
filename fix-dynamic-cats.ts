import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Add state for dynamic categories
content = content.replace(
  /const \[isLoadingBooks, setIsLoadingBooks\] = useState\(false\);/,
  "const [isLoadingBooks, setIsLoadingBooks] = useState(false);\n  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['Fantasy', 'Romance', 'Mystery']);"
);

// Fetch categories inside initial fetch
const initialFetchMatch = `const { data: initialFeatured } = await supabase
        .from('books')
        .select('*')
        .eq('featured', true)
        .limit(20)
        .order('created_at', { ascending: false });

      if (initialFeatured) {
        setFeaturedBooks(initialFeatured);
      }`;

const newInitialFetch = `${initialFetchMatch}

      // Fetch categories lightweight
      const { data: catData } = await supabase
        .from('books')
        .select('categories');
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
        
        const fixedCategoriesSet = new Set(['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy']);
        setDynamicCategories(sorted.filter(c => !fixedCategoriesSet.has(c)));
      }`;

content = content.replace(initialFetchMatch, newInitialFetch);

// Update displayCategories
const catsRegex = /const famousGenres = \['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography'\];\n  const fixedCategories = \['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy'\];\n  const displayCategories = \[\.\.\.fixedCategories, 'Fantasy', 'Romance', 'Mystery'\];\n  const hasMoreCategories = true;/;

const newCats = `const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography'];
  const fixedCategories = ['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy'];
  const displayCategories = [...fixedCategories, ...dynamicCategories.slice(0, 3)];
  const hasMoreCategories = dynamicCategories.length > 3;`;

content = content.replace(catsRegex, newCats);

fs.writeFileSync('src/pages/Home.tsx', content);

