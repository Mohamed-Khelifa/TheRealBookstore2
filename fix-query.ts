import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const regex = /\/\/ Language[\s\S]*?\/\/ Sorting \& Pagination logic/m;

const replacement = `// Language
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'French') {
          query = query.overlaps('categories', ['French', 'french', 'Français', 'français', 'Francais', 'francais']);
        } else if (selectedLanguage === 'Arabic') {
          query = query.overlaps('categories', ['Arabic', 'arabic', 'Arab', 'arab', 'العربية']);
        } else if (selectedLanguage === 'Manga') {
          query = query.overlaps('categories', ['Manga', 'manga']);
        } else if (selectedLanguage === 'Algerian') {
          query = query.overlaps('categories', ['Algerian', 'algerian', 'Algerien', 'algerien', 'Algérien', 'algérien', 'DZ', 'dz', 'الجزائر']);
        } else if (selectedLanguage === 'English') {
          query = query.overlaps('categories', ['English', 'english', 'Anglais', 'anglais']);
        }
      }

      // Sorting & Pagination logic`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/Home.tsx', content);
