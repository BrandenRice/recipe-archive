/**
 * App component - Main application entry point with routing
 * Requirements: 2.1
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  AppShell, 
  RecipeListPage, 
  NewRecipePage, 
  RecipeEditorPage, 
  TemplateManagerPage,
  CollectionsPage,
} from './components';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<RecipeListPage />} />
          <Route path="new" element={<NewRecipePage />} />
          <Route path="recipe/:id" element={<RecipeEditorPage />} />
          <Route path="recipe/:id/edit" element={<RecipeEditorPage />} />
          <Route path="templates" element={<TemplateManagerPage />} />
          <Route path="collections" element={<CollectionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
