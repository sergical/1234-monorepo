#!/bin/sh

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create commit-msg hook
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/sh
npx --no -- commitlint --edit "$1"
EOF

# Make the hook executable
chmod +x .git/hooks/commit-msg

echo "Git hooks installed successfully!" 