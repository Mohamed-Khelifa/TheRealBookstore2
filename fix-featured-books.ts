import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

content = content.replace(
  /const \[books, setBooks\] = useState<Book\[\]>\(\[\]\);/,
  "const [books, setBooks] = useState<Book[]>([]);\n  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);"
);

// Fetch featured books in the initial fetch
const initialFetchMatch = `const { data: initialBooks } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 49);`;

const newInitialFetch = `${initialFetchMatch}

      const { data: initialFeatured } = await supabase
        .from('books')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false });

      if (initialFeatured) {
        setFeaturedBooks(initialFeatured);
      }`;

content = content.replace(initialFetchMatch, newInitialFetch);

// Fix the render part
content = content.replace(
  /<HeroScrollDemo featuredBooks=\{books\.filter\(b => b\.featured\)\} \/>/,
  "<HeroScrollDemo featuredBooks={featuredBooks} />"
);

fs.writeFileSync('src/pages/Home.tsx', content);
