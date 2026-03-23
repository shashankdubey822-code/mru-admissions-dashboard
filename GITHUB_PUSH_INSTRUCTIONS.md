# GitHub Push Instructions

## Step 1: Create a new repository on GitHub

1. Go to https://github.com/new
2. Repository name: `mru-admissions-dashboard` (or your preferred name)
3. Description: `Real-time admissions analytics dashboard powered by Google Sheets`
4. Choose Public or Private
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Add remote and push

Copy your repo URL (format: https://github.com/YOUR_USERNAME/mru-admissions-dashboard.git)

Then run these commands:

```bash
cd "/c/Users/hp/OneDrive - Manav Rachna Education Institutions/Desktop/OWN_2025/mamta_02"

# Add remote (replace URL with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/mru-admissions-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Set up HuggingFace Spaces

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Fill in:
   - **Space name**: mru-admissions-dashboard
   - **License**: MIT
   - **SDK**: Docker
4. Click "Create Space"

## Step 4: Connect GitHub to HuggingFace

In your new HF Space:
1. Go to "Settings" → "Repository"
2. Click "Link to a GitHub repository"
3. Select your GitHub repo

## Step 5: Add Environment Secrets to HF Space

1. Go to Space "Settings" → "Repository secrets"
2. Add:
   - **GOOGLE_SHEET_ID**: `14KlLp4Dvrx3sSp4t3uesGFBQZAUnp0sfHaPNOL1WX3Q`
   - **GOOGLE_API_KEY**: `your_api_key_here`

## Step 6: Deploy!

HuggingFace will automatically:
- Pull from GitHub
- Build the Docker image
- Deploy your dashboard
- Give you a public URL

That's it! Your dashboard will be live and continuously updated from your repository.

## Future Workflow

When you make changes:
```bash
git add .
git commit -m "Your message"
git push origin main
```

HF Space will auto-rebuild and redeploy within 2-3 minutes.
