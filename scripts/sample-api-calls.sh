#!/bin/bash

# Sample API calls to demonstrate the backend functionality
# Make sure the application is running before executing this script

API_BASE="http://localhost:3000"
TOKEN=""

echo "========================================"
echo "Backend API Sample Calls"
echo "========================================"

# 1. Health Check
echo -e "\n1. Health Check"
curl -s $API_BASE/health | jq .

# 2. Register a new user
echo -e "\n2. Register a new user"
REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password123",
    "firstName": "Demo",
    "lastName": "User"
  }')
echo $REGISTER_RESPONSE | jq .

# 3. Login
echo -e "\n3. Login"
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | jq .

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# 4. Get Profile
echo -e "\n4. Get User Profile"
curl -s -X GET $API_BASE/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Create a Device
echo -e "\n5. Create a Device"
DEVICE_RESPONSE=$(curl -s -X POST $API_BASE/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Camera 1",
    "serialNumber": "SN-12345",
    "type": "camera",
    "status": "online",
    "location": "Building A, Floor 2",
    "metadata": {
      "firmware": "1.0.0",
      "model": "X1000"
    }
  }')
echo $DEVICE_RESPONSE | jq .

DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.id')
echo "Device ID: $DEVICE_ID"

# 6. Get All Devices
echo -e "\n6. Get All Devices"
curl -s -X GET $API_BASE/devices \
  -H "Authorization: Bearer $TOKEN" | jq .

# 7. Create Monitoring Feed
echo -e "\n7. Create Monitoring Feed"
curl -s -X POST $API_BASE/monitoring \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"deviceId\": \"$DEVICE_ID\",
    \"type\": \"metric\",
    \"severity\": \"info\",
    \"message\": \"Temperature reading\",
    \"data\": {
      \"temperature\": 25.5,
      \"unit\": \"celsius\"
    }
  }" | jq .

# 8. Create an Incident
echo -e "\n8. Create an Incident"
INCIDENT_RESPONSE=$(curl -s -X POST $API_BASE/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Device malfunction\",
    \"description\": \"Camera stopped responding\",
    \"priority\": \"high\",
    \"deviceId\": \"$DEVICE_ID\"
  }")
echo $INCIDENT_RESPONSE | jq .

INCIDENT_ID=$(echo $INCIDENT_RESPONSE | jq -r '.id')

# 9. Get All Incidents
echo -e "\n9. Get All Incidents"
curl -s -X GET $API_BASE/incidents \
  -H "Authorization: Bearer $TOKEN" | jq .

# 10. Create a Notification
echo -e "\n10. Create a Notification"
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
curl -s -X POST $API_BASE/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"email\",
    \"subject\": \"Incident Alert\",
    \"message\": \"A new critical incident has been created\",
    \"metadata\": {
      \"incidentId\": \"$INCIDENT_ID\"
    }
  }" | jq .

# 11. Create Admin Setting
echo -e "\n11. Create Admin Setting"
curl -s -X POST $API_BASE/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "key": "max_devices",
    "value": "100",
    "type": "number",
    "description": "Maximum number of devices allowed"
  }' | jq .

# 12. Get All Settings
echo -e "\n12. Get All Settings"
curl -s -X GET $API_BASE/admin/settings \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n========================================"
echo "All sample API calls completed!"
echo "========================================"
