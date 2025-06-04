#!/bin/bash

echo "🚀 Habit Monitor Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy habit monitor app"
fi
git commit -m "$commit_msg"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Setting up GitHub remote..."
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin $repo_url
fi

# Push to GitHub
echo "🌐 Pushing to GitHub..."
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🌟 Next Steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Import your repository"
echo "4. Set up environment variables:"
echo "   - DATABASE_URL (from Railway/Supabase/PlanetScale)"
echo "   - NEXTAUTH_URL (your vercel app URL)"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "📱 Your app will be available at: https://your-app-name.vercel.app" 