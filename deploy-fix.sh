#!/bin/bash

# Deployment Fix Script
echo "🚀 Fixing deployment lockfile issue..."

# Remove conflicting lockfiles
echo "📁 Removing old lockfiles..."
rm -f pnpm-lock.yaml
rm -f package-lock.json

# Install with npm to create fresh lockfile
echo "📦 Installing dependencies with npm..."
npm install

# Add all changes
echo "📝 Staging changes..."
git add .

# Commit changes
echo "💾 Committing deployment fix..."
git commit -m "fix: resolve lockfile mismatch for deployment

- Remove pnpm-lock.yaml and use npm
- Add vercel.json for deployment config
- Update next.config.ts for build optimization
- Add postinstall script for Prisma generation
- Update .gitignore to prevent lockfile conflicts"

# Push changes
echo "🚀 Pushing to repository..."
git push

echo "✅ Deployment fix complete! Your app should now deploy successfully."
echo "🔗 Check your Vercel dashboard for the new deployment."
