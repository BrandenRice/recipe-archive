# Recipe Archive

A client-side web application for digitizing, organizing, and printing family recipes. Upload photos of handwritten or printed recipes, extract text using OCR, organize with tags, and print on recipe cards or standard paper sizes.

## Features

- **Recipe Digitization**: Upload photos (JPEG, PNG, PDF) and extract text using Tesseract.js OCR
- **Recipe Management**: Create, edit, and organize recipes with title, author, ingredients, steps, and notes
- **Tagging System**: Categorize recipes with custom tags and filter by tag (AND/OR modes), author, or text search
- **Template System**: Customize print layouts with a WYSIWYG editor supporting multiple print sizes
- **Print Sizes**: Recipe cards (3x5, 4x6, 5x7 inches) and standard paper (Letter, Legal, A4, A5)
- **Export Options**: Generate PDF or DOCX files with applied template layouts
- **Backup/Restore**: Export and import your entire recipe collection as JSON

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **OCR**: Tesseract.js
- **PDF Export**: jsPDF
- **DOCX Export**: docx
- **Storage**: IndexedDB (with localStorage fallback)
- **Testing**: Vitest + fast-check (property-based testing)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
├── adapters/           # Storage, OCR, and export adapters
├── components/         # React UI components
│   └── pages/          # Page-level components
├── services/           # Business logic (filtering, tags, templates, etc.)
├── test/               # Property-based and unit tests
└── types/              # TypeScript interfaces and types
```

## Architecture

The application follows a layered architecture with abstract interfaces for extensibility:

- **Presentation Layer**: React components for UI
- **Application Layer**: Services for business logic
- **Adapter Layer**: Abstract interfaces (Storage, OCR, Export)
- **Infrastructure Layer**: Concrete implementations (IndexedDB, Tesseract.js, jsPDF)

## Testing

The project uses property-based testing with fast-check to verify 16 correctness properties:

- Recipe persistence round-trip
- Recipe deletion and retrieval
- Timestamp updates on modifications
- Tag operations (add/remove)
- Filtering and sorting
- Template validation and overlap detection
- Export document generation
- Backup/restore data integrity

Run tests with 100+ iterations per property:

```bash
npm test
```

## License

MIT
