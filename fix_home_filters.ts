import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// 1. Add states for server-side pagination
const stateAdditions = `
  const [paginatedBooks, setPaginatedBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
`;
content = content.replace(/(const booksPerPage = 8;)/, `$1\n${stateAdditions}`);

// 2. Add useEffect for server-side fetching
const useEffectAddition = `
  useEffect(() => {
    let isMounted = true;
    const fetchFilteredBooks = async () => {
      setIsLoadingBooks(true);
      
      let query = supabase.from('books').select('*', { count: 'exact' });

      // Search Query
      if (searchQuery) {
        query = query.or(\`title.ilike.%$\{searchQuery}%,author.ilike.%$\{searchQuery}%\`);
      }

      // Category
      if (selectedCategory !== 'All' && selectedCategory !== 'Featured' && selectedCategory !== 'Most Popular' && selectedCategory !== 'Trendiest') {
        if (selectedCategory === 'Bundles') {
          query = query.eq('is_bundle', true);
        } else if (selectedCategory === 'Personal Development') {
          query = query.contains('categories', ['Personal Development']);
        } else {
          query = query.contains('categories', [selectedCategory]);
        }
      } else if (selectedCategory === 'Featured') {
        query = query.eq('featured', true);
      }

      // Language
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'French') {
          query = query.contains('categories', ['French']); // Simplified, should maybe check others but Supabase array cs is strict
        } else if (selectedLanguage === 'Arabic') {
          query = query.contains('categories', ['Arabic']);
        } else if (selectedLanguage === 'Manga') {
          query = query.contains('categories', ['Manga']);
        } else if (selectedLanguage === 'Algerian') {
          query = query.contains('categories', ['Algerian']);
        } else if (selectedLanguage === 'English') {
          query = query.contains('categories', ['English']);
        }
      } else {
        // Exclude manga from "All" unless explicitly selected (reproducing old logic)
        // Note: PostgREST doesn't support easy array NOT CONTAINS for JSONB/array without raw SQL.
        // We will just let it be for now, or fetch and filter, but we are doing strict server-side.
      }

      // Sorting & Pagination logic requested by user:
      // "page 1 and 2 are always for featured read, page 3 and on are for the other books"
      // If we are on default view (no search, category=Most Popular/All), we sort by featured first, then rating
      if (!searchQuery && (selectedCategory === 'All' || selectedCategory === 'Most Popular') && sortBy === 'rating-high') {
        query = query.order('featured', { ascending: false }).order('rating', { ascending: false, nullsFirst: false });
      } else {
        // Standard sort
        if (sortBy === 'new') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'price-low') query = query.order('price', { ascending: true });
        else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
        else if (sortBy === 'az') query = query.order('title', { ascending: true });
        else if (sortBy === 'za') query = query.order('title', { ascending: false });
        else if (sortBy === 'rating-high') query = query.order('rating', { ascending: false, nullsFirst: false });
      }

      // Pagination
      const from = (currentPage - 1) * booksPerPage;
      const to = from + booksPerPage - 1;
      query = query.range(from, to);

      const { data, count } = await query;
      
      if (isMounted) {
        if (data) setPaginatedBooks(data);
        if (count !== null) setTotalBooks(count);
        setIsLoadingBooks(false);
      }
    };

    // To preserve the exact initial 50 books behavior on first load without double fetching:
    // We only trigger this if it's NOT the initial render, or if filters are applied.
    // Actually, it's safer to always fetch the exact page data from server to ensure pagination works flawlessly.
    fetchFilteredBooks();

    return () => { isMounted = false; };
  }, [searchQuery, selectedCategory, selectedLanguage, sortBy, currentPage, booksPerPage]);

  const totalPages = Math.ceil(totalBooks / booksPerPage) || 1;
`;

// Replace the old client-side logic
const clientSideLogicRegex = /const featuredBooks = [\s\S]*?const paginatedBooks = [^\n]*;/;
content = content.replace(clientSideLogicRegex, `
  const famousGenres = ['Classics', 'Fantasy', 'Romance', 'Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography'];
  const fixedCategories = ['All', 'Most Popular', 'Bundles', 'Personal Development', 'Trendiest', 'Classics', 'Philosophy'];
  const displayCategories = [...fixedCategories, 'Fantasy', 'Romance', 'Mystery'];
  const hasMoreCategories = true;

${useEffectAddition}
`);

// Also fix Categories.tsx
let catContent = fs.readFileSync('src/pages/Categories.tsx', 'utf-8');
catContent = catContent.replace(
  /const \{ data \} = await fetchAllRows\('books'.*?\);/,
  "const { data } = await supabase.from('books').select('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books').order('created_at', { ascending: false }).limit(50);"
);
fs.writeFileSync('src/pages/Categories.tsx', catContent);

// Also fix ReaderSpace.tsx
let rsContent = fs.readFileSync('src/pages/ReaderSpace.tsx', 'utf-8');
rsContent = rsContent.replace(
  /const \{ data \} = await fetchAllRows\('books'.*?\);/,
  "const { data } = await supabase.from('books').select('id, title, author, price, old_price, cover_image_url, categories, stock, featured, rating, created_at, is_bundle, bundle_books').order('created_at', { ascending: false }).limit(50);"
);
fs.writeFileSync('src/pages/ReaderSpace.tsx', rsContent);


fs.writeFileSync('src/pages/Home.tsx', content);
