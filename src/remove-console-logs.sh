#!/bin/bash

# ============================================================================
# REMOVE ALL CONSOLE LOGS FOR PRODUCTION
# ============================================================================
# This script removes all console.log, console.error, console.warn, and
# console.info statements from TypeScript/JavaScript files
# ============================================================================

echo "🧹 Removing all console statements for production build..."
echo ""

# Files to clean
FILES=(
  "App.tsx"
  "components/auth-page.tsx"
  "components/api-setup.tsx"
  "components/feedback-dialog.tsx"
  "lib/gemini.ts"
  "lib/email-service.ts"
  "lib/supabase.ts"
  "lib/database-service.ts"
  "lib/copy-utils.ts"
  "lib/speech-recognition.ts"
)

# Counter for removed lines
TOTAL_REMOVED=0

# Function to remove console statements from a file
clean_file() {
  local file=$1
  
  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    return
  fi
  
  echo "📄 Cleaning: $file"
  
  # Count console statements before
  BEFORE=$(grep -c "console\.\(log\|error\|warn\|info\)" "$file" 2>/dev/null || echo "0")
  
  # Remove console statements (sed command)
  # This removes entire lines that contain console.log/error/warn/info
  sed -i.bak '/console\.\(log\|error\|warn\|info\)/d' "$file"
  
  # Count console statements after
  AFTER=$(grep -c "console\.\(log\|error\|warn\|info\)" "$file" 2>/dev/null || echo "0")
  
  # Calculate removed
  REMOVED=$((BEFORE - AFTER))
  TOTAL_REMOVED=$((TOTAL_REMOVED + REMOVED))
  
  echo "   ✅ Removed $REMOVED console statements"
  
  # Remove backup file
  rm -f "${file}.bak"
}

# Clean each file
for file in "${FILES[@]}"; do
  clean_file "$file"
done

echo ""
echo "✨ Production cleanup complete!"
echo "📊 Total console statements removed: $TOTAL_REMOVED"
echo ""
echo "⚠️  IMPORTANT: Review the changes before committing!"
echo "💡 TIP: Run 'git diff' to see what was removed"
echo ""

# ============================================================================
# USAGE:
# ============================================================================
# 1. Make the script executable:
#    chmod +x remove-console-logs.sh
#
# 2. Run the script:
#    ./remove-console-logs.sh
#
# 3. Review changes:
#    git diff
#
# 4. Commit if satisfied:
#    git add .
#    git commit -m "Remove console logs for production"
# ============================================================================
