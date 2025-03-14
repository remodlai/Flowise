#!/bin/bash

# Test script for uploading an application logo

# Set variables
APP_ID="05955f73-4e1e-4323-9670-5cef6708ca69"
API_KEY="SzhoGvFA_pUgn5GaKBbXPW8CWLH1jkjx4VhsIXiMaYY"
LOGO_FILE="test-logo.svg"
API_URL="http://localhost:3000/api/v1/applications/$APP_ID/assets/logo/upload"

# Upload the logo
echo "Uploading logo to $API_URL..."
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@$LOGO_FILE" \
  $API_URL

echo -e "\n\nTesting logo URL endpoint..."
curl -H "Authorization: Bearer $API_KEY" \
  "http://localhost:3000/api/v1/applications/$APP_ID/assets/logo/url"

echo -e "\n\nDone!" 