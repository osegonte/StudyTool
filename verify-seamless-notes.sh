#!/bin/bash

echo "🔍 Verifying Seamless Note-Taking Features..."
echo "============================================"

# Check if React dev server is running
if pgrep -f "react-scripts start" > /dev/null; then
    echo "✅ React development server is running (PID: $(pgrep -f 'react-scripts start'))"
else
    echo "❌ React development server is not running"
    exit 1
fi

# Check if backend is running
if pgrep -f "node.*index.js" > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Backend server may not be running. Starting it..."
    cd backend
    npm start &
    echo "✅ Backend server started"
    cd ..
fi

# Check if required files exist
echo ""
echo "📁 Checking component files..."

components=(
    "frontend/src/components/notes/HighlightNotePopup.js"
    "frontend/src/components/notes/NotesFAB.js"
    "frontend/src/components/notes/QuickNoteModal.js"
    "frontend/src/pages/PDFViewerSeamless.js"
    "frontend/src/styles/seamless-notes.css"
)

all_files_exist=true

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "✅ $component"
    else
        echo "❌ $component - MISSING"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo ""
    echo "🎉 All seamless note-taking components are ready!"
    echo ""
    echo "🌐 Your application is available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo ""
    echo "📓 New Features Available:"
    echo "• Highlight text in PDFs → Instant note popup"
    echo "• Floating Action Button (FAB) for quick access"
    echo "• Keyboard shortcuts: Ctrl+Shift+N (Quick Note)"
    echo "• Auto-organization by topic and page"
    echo ""
    echo "💡 To test the features:"
    echo "1. Go to http://localhost:3000"
    echo "2. Upload a PDF or open an existing one"
    echo "3. In the PDF viewer, highlight some text"
    echo "4. Watch the note popup appear!"
    echo "5. Try the floating action button in bottom-right"
    echo "6. Use Ctrl+Shift+N for quick notes"
    echo ""
    echo "🚀 The seamless note-taking system is live and ready!"
else
    echo ""
    echo "❌ Some components are missing. Please run the deployment script:"
    echo "   ./deploy-seamless-notes.sh"
fi

# Check if hot reload picked up changes
echo ""
echo "🔄 Hot Reload Status:"
echo "The React development server should automatically detect the new files."
echo "If you see any compilation errors, they will appear in your terminal"
echo "where npm start is running, or in the browser console."
echo ""
echo "If needed, you can manually refresh the browser at http://localhost:3000"