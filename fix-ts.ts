import fs from 'fs';

let bundleCover = fs.readFileSync('src/components/BundleCover.tsx', 'utf-8');
bundleCover = bundleCover.replace(
  /onBookClick\(\{\n\s*id: book\.id,\n\s*title: book\.title,\n\s*cover_image_url: book\.cover_image_url\n\s*\}\)/g,
  `onBookClick({ id: book.id, title: book.title, cover_image_url: book.cover_image_url } as any)`
);
fs.writeFileSync('src/components/BundleCover.tsx', bundleCover);

let bookDetail = fs.readFileSync('src/pages/BookDetail.tsx', 'utf-8');
bookDetail = bookDetail.replace(/setRecommendedBooks\(data\)/g, 'setRecommendedBooks(data as any)');
fs.writeFileSync('src/pages/BookDetail.tsx', bookDetail);

let home = fs.readFileSync('src/pages/Home.tsx', 'utf-8');
home = home.replace(/setRecommendedBooks\(data\)/g, 'setRecommendedBooks(data as any)');
fs.writeFileSync('src/pages/Home.tsx', home);

let readerSpace = fs.readFileSync('src/pages/ReaderSpace.tsx', 'utf-8');
readerSpace = readerSpace.replace(/setBooks\(data\)/g, 'setBooks(data as any)');
fs.writeFileSync('src/pages/ReaderSpace.tsx', readerSpace);
