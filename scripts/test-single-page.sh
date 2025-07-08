#!/bin/bash

echo "🧪 Testing Single Page PDF Viewer with Accurate Timing"
echo "===================================================="

echo "Testing backend connection..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
    
    echo ""
    echo "📋 Single Page Viewer Features to Test:"
    echo "1. ✅ Backend running"
    echo "2. ⏳ Open any PDF in viewer"
    echo "3. ⏳ Check for single-page display (one page at a time)"
    echo "4. ⏳ Test navigation controls:"
    echo "     • Previous/Next buttons"
    echo "     • Page number input"
    echo "     • Keyboard arrows (← →)"
    echo "     • Zoom controls (+ -)"
    echo "     • Rotation (r key)"
    echo ""
    echo "📊 Enhanced Timer Features to Test:"
    echo "5. ⏳ Timer shows current page time"
    echo "6. ⏳ Timer shows total session time"
    echo "7. ⏳ Navigate to different pages"
    echo "8. ⏳ Go back to previous page - should show 'Revisiting'"
    echo "9. ⏳ Timer should continue from where it left off"
    echo "10. ⏳ Pause/Resume functionality"
    echo "11. ⏳ Pages visited counter updates"
    echo ""
    echo "🎯 Expected Behavior:"
    echo "  • ✅ ONE page displayed at a time"
    echo "  • ✅ Page timer resets on new pages"
    echo "  • ✅ Page timer continues on revisited pages"
    echo "  • ✅ Session timer always accumulates"
    echo "  • ✅ 'Revisiting' badge on previously seen pages"
    echo "  • ✅ Accurate per-page time tracking"
    echo ""
    echo "🚀 Start testing:"
    echo "   ./scripts/start-phase1.sh"
    
else
    echo "❌ Backend not running. Start with: ./scripts/start-phase1.sh"
fi
