import fs from 'fs';

let code = fs.readFileSync('src/pages/BookDetail.tsx', 'utf-8');

const COLS = 'id, title, author, price, old_price, cover_image_url, rating, is_bundle, bundle_books, featured, categories, created_at';

// In BookDetail, it's fine to do .select('*') for the current book, but we should fix bundleData and allOtherBooks.

code = code.replace(
  /const \{ data: bundleData \} = await supabase\s*\.from\('books'\)\s*\.select\('\*'\)\s*\.in\('id', data\.bundle_books\);/,
  `const { data: bundleData } = await supabase
            .from('books')
            .select('${COLS}')
            .in('id', data.bundle_books);`
);

const relatedBooksLogic = `        // Fetch related books based on categories, author, and rating
        const currentCategories = data.categories || [];
        const currentAuthor = data.author || '';
        
        let relatedQuery = supabase
          .from('books')
          .select('${COLS}')
          .neq('id', id);
          
        if (currentCategories.length > 0) {
          relatedQuery = relatedQuery.overlaps('categories', currentCategories);
        }
        
        const { data: allOtherBooks } = await relatedQuery.limit(50);`;

code = code.replace(
  /\/\/ Fetch related books based on categories, author, and rating[\s\S]*?\.neq\('id', id\);/,
  relatedBooksLogic
);

// We need to ensure we remove the lines:
// const currentCategories = data.categories || [];
// const currentAuthor = data.author || '';
// from right below where we replaced it, since we moved them up.

code = code.replace(
  /if \(allOtherBooks\) \{\s*const currentCategories = data\.categories \|\| \[\];\s*const currentAuthor = data\.author \|\| '';/,
  `if (allOtherBooks) {`
);

fs.writeFileSync('src/pages/BookDetail.tsx', code);
