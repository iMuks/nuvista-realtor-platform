# GCP Deployment Guide — RealtorHub

Complete guide to deploying the RealtorHub platform on Google Cloud Platform.

## Architecture on GCP

```
Internet → Cloud Load Balancer (HTTPS)
             ├── /api/*  → Cloud Run (Backend)
             └── /*      → Cloud Run (Frontend)
                              │
                     MongoDB Atlas (GCP Region)
                              │
                     Cloud Storage (Images)
```

## Prerequisites

- GCP Account with billing enabled
- `gcloud` CLI installed and configured
- Docker installed locally
- MongoDB Atlas account (free tier works for dev)

---

## Step 1: GCP Project Setup

```bash
# Create project
gcloud projects create realtorhub-prod --name="RealtorHub"
gcloud config set project realtorhub-prod

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com

# Set default region (Toronto)
gcloud config set run/region northamerica-northeast1
```

## Step 2: MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and create an account
2. Create a new cluster — select **GCP** as provider, **Montreal (northamerica-northeast1)** as region
3. Choose **M0 Free Tier** for dev, or **M10+** for production
4. Create a database user with read/write access
5. Whitelist Cloud Run's IP range (or use `0.0.0.0/0` with strong auth)
6. Get connection string: `mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/realtorhub`

## Step 3: Secret Manager

```bash
# Store secrets
echo -n "mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/realtorhub" | \
  gcloud secrets create mongodb-uri --data-file=-

echo -n "your-super-secret-jwt-key" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "your-google-maps-api-key" | \
  gcloud secrets create google-maps-key --data-file=-
```

## Step 4: Cloud Storage (Images)

```bash
# Create bucket for property images
gsutil mb -l northamerica-northeast1 gs://realtorhub-images

# Set CORS for frontend uploads
cat > cors.json << 'EOF'
[{
  "origin": ["https://your-domain.com", "http://localhost:5173"],
  "method": ["GET", "PUT", "POST", "DELETE"],
  "responseHeader": ["Content-Type"],
  "maxAgeSeconds": 3600
}]
EOF
gsutil cors set cors.json gs://realtorhub-images

# Make images publicly readable
gsutil iam ch allUsers:objectViewer gs://realtorhub-images
```

## Step 5: Artifact Registry

```bash
# Create Docker repo
gcloud artifacts repositories create realtorhub \
  --repository-format=docker \
  --location=northamerica-northeast1

# Configure Docker auth
gcloud auth configure-docker northamerica-northeast1-docker.pkg.dev
```

## Step 6: Build & Push Docker Images

```bash
REGION=northamerica-northeast1
PROJECT_ID=realtorhub-prod
REPO=${REGION}-docker.pkg.dev/${PROJECT_ID}/realtorhub

# Backend
cd backend
docker build -t ${REPO}/api:latest .
docker push ${REPO}/api:latest

# Frontend
cd ../frontend
docker build -t ${REPO}/web:latest .
docker push ${REPO}/web:latest
```

## Step 7: Deploy to Cloud Run

### Backend API

```bash
gcloud run deploy realtorhub-api \
  --image ${REPO}/api:latest \
  --platform managed \
  --region northamerica-northeast1 \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --set-secrets "MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-key:latest" \
  --set-env-vars "NODE_ENV=production,PORT=5000,CORS_ORIGIN=https://your-domain.com,GCP_PROJECT_ID=${PROJECT_ID},GCP_STORAGE_BUCKET=realtorhub-images" \
  --allow-unauthenticated
```

### Frontend Web

```bash
gcloud run deploy realtorhub-web \
  --image ${REPO}/web:latest \
  --platform managed \
  --region northamerica-northeast1 \
  --port 80 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --allow-unauthenticated
```

## Step 8: CI/CD with Cloud Build

Place `cloudbuild.yaml` at the repo root (already included in the project).

```bash
# Connect GitHub repo
gcloud builds triggers create github \
  --repo-owner=YOUR_GITHUB_USER \
  --repo-name=realtor-platform \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml

# Grant Cloud Build access to secrets
gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 9: Custom Domain + SSL

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service realtorhub-web \
  --domain your-domain.com \
  --region northamerica-northeast1

# Follow DNS instructions from gcloud output
# SSL is automatically provisioned by Cloud Run
```

## Step 10: Monitoring

```bash
# Enable uptime checks
gcloud monitoring uptime-check-configs create \
  --display-name="API Health" \
  --http-check-path="/api/health" \
  --monitored-resource-type="uptime_url"

# Set up alerts for errors, latency, etc.
# Visit: https://console.cloud.google.com/monitoring
```

---

## Cost Estimates (Monthly)

| Service             | Dev/Staging   | Production     |
|---------------------|---------------|----------------|
| Cloud Run (Backend) | ~$0 (free tier) | ~$15–50       |
| Cloud Run (Frontend)| ~$0 (free tier) | ~$5–20        |
| MongoDB Atlas       | $0 (M0 free) | $57+ (M10)     |
| Cloud Storage       | ~$0.02/GB     | ~$1–5          |
| Secret Manager      | ~$0           | ~$0.06         |
| Load Balancer       | N/A           | ~$18           |
| **Total**           | **~$0**       | **~$100–150**  |

## Seed Production DB

```bash
# Run seed from Cloud Shell or locally with Atlas URI
cd backend
MONGODB_URI="mongodb+srv://..." npm run seed
```
