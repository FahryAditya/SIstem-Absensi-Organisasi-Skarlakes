# Flutter API Documentation

## Base URL
```
https://your-domain.vercel.app/api/flutter
```

## Authentication
Semua endpoint memerlukan JWT token di header:
```
Authorization: Bearer <your-jwt-token>
```

Token didapat dari endpoint `/api/flutter/auth/login`

---

## 📱 Auth Endpoints

### 1. Login
**POST** `/api/flutter/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "nama": "Admin User",
      "email": "admin@example.com",
      "role": "administrator",
      "organizations": []
    }
  }
}
```

---

## 📋 Session Wawancara Endpoints

### 2. Create Session
**POST** `/api/flutter/sessions/create`

**Request Body:**
```json
{
  "organisasiType": "programming",
  "jadwalMulai": "2024-01-20T09:00:00Z",
  "jadwalSelesai": "2024-01-20T17:00:00Z"
}
```

**Valid organisasiType:** `programming`, `english`, `osis`, `mpk`

**Response:**
```json
{
  "success": true,
  "message": "Sesi wawancara berhasil dibuat",
  "data": {
    "id": 1,
    "status": "ACTIVE",
    "organisasiType": "programming",
    "jadwalMulai": "2024-01-20T09:00:00.000Z",
    "jadwalSelesai": "2024-01-20T17:00:00.000Z",
    "createdAt": "2024-01-20T08:00:00.000Z"
  }
}
```

### 3. List Sessions
**GET** `/api/flutter/sessions/list?status=ACTIVE&organisasiType=programming`

**Query Parameters:**
- `status` (optional): Filter by status
- `organisasiType` (optional): Filter by organization type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "ACTIVE",
      "organisasiType": "programming",
      "jadwalMulai": "2024-01-20T09:00:00.000Z",
      "jadwalSelesai": "2024-01-20T17:00:00.000Z",
      "finalizedAt": null,
      "lockedAt": null,
      "createdAt": "2024-01-20T08:00:00.000Z",
      "totalQrCodes": 3,
      "activeQrCodes": 2,
      "totalAntrian": 15,
      "antrianMenunggu": 5,
      "antrianSelesai": 10,
      "totalMessages": 8
    }
  ]
}
```

---

## 🔳 QR Code Endpoints

### 4. Generate QR Code
**POST** `/api/flutter/qr/generate`

**Request Body:**
```json
{
  "sesiId": 1,
  "validHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR Code berhasil dibuat",
  "data": {
    "id": 1,
    "token": "abc123def456...",
    "qrUrl": "https://your-domain.vercel.app/scan/abc123def456...",
    "aktif": true,
    "validFrom": "2024-01-20T08:00:00.000Z",
    "validUntil": "2024-01-21T08:00:00.000Z",
    "sesi": {
      "status": "ACTIVE",
      "organisasiType": "programming",
      "jadwalMulai": "2024-01-20T09:00:00.000Z",
      "jadwalSelesai": "2024-01-20T17:00:00.000Z"
    }
  }
}
```

### 5. List QR Codes
**GET** `/api/flutter/qr/list?sesiId=1&aktif=true`

**Query Parameters:**
- `sesiId` (optional): Filter by session ID
- `aktif` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "token": "abc123def456...",
      "qrUrl": "https://your-domain.vercel.app/scan/abc123def456...",
      "aktif": true,
      "validFrom": "2024-01-20T08:00:00.000Z",
      "validUntil": "2024-01-21T08:00:00.000Z",
      "sesi": {
        "status": "ACTIVE",
        "organisasiType": "programming",
        "jadwalMulai": "2024-01-20T09:00:00.000Z",
        "jadwalSelesai": "2024-01-20T17:00:00.000Z"
      },
      "totalAntrian": 5
    }
  ]
}
```

### 6. Download QR Code Data
**GET** `/api/flutter/qr/download?qrId=1`

**Query Parameters:**
- `qrId` (required): QR Code ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "token": "abc123def456...",
    "qrData": "abc123def456...",
    "qrUrl": "https://your-domain.vercel.app/scan/abc123def456...",
    "aktif": true,
    "validFrom": "2024-01-20T08:00:00.000Z",
    "validUntil": "2024-01-21T08:00:00.000Z",
    "sesi": {
      "id": 1,
      "status": "ACTIVE",
      "organisasiType": "programming",
      "jadwalMulai": "2024-01-20T09:00:00.000Z",
      "jadwalSelesai": "2024-01-20T17:00:00.000Z"
    }
  }
}
```

**Flutter Implementation:**
```dart
// Use qr_flutter package to generate QR image
import 'package:qr_flutter/qr_flutter.dart';

QrImageView(
  data: response['data']['qrData'], // Use this field
  version: QrVersions.auto,
  size: 300.0,
)
```

### 7. Toggle QR Code Status
**PUT** `/api/flutter/qr/toggle`

**Request Body:**
```json
{
  "qrId": 1,
  "aktif": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR Code dinonaktifkan",
  "data": {
    "id": 1,
    "token": "abc123def456...",
    "aktif": false,
    "validFrom": "2024-01-20T08:00:00.000Z",
    "validUntil": "2024-01-21T08:00:00.000Z",
    "sesi": {
      "status": "ACTIVE",
      "organisasiType": "programming"
    }
  }
}
```

---

## 📍 Location Endpoints

### 8. Send Location
**POST** `/api/flutter/location/send`

**Request Body:**
```json
{
  "antrianId": 1,
  "latitude": -7.250445,
  "longitude": 112.768845,
  "targetLatitude": -7.250445,
  "targetLongitude": 112.768845,
  "maxDistanceMeters": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lokasi berhasil dikirim",
  "data": {
    "antrianId": 1,
    "latitude": -7.250445,
    "longitude": 112.768845,
    "distance": 45,
    "isValid": true,
    "statusValidasi": "SAH",
    "alasanValidasi": "Lokasi valid (45m dari lokasi)",
    "targetLocation": {
      "latitude": -7.250445,
      "longitude": 112.768845
    }
  }
}
```

**Flutter Implementation:**
```dart
import 'package:geolocator/geolocator.dart';

// Get current location
Position position = await Geolocator.getCurrentPosition();

// Send to API
await sendLocation(
  antrianId: 1,
  latitude: position.latitude,
  longitude: position.longitude,
);
```

---

## 💬 Messaging Endpoints

### 9. Send Message
**POST** `/api/flutter/messages/send`

**Request Body:**
```json
{
  "sesiId": 1,
  "pesan": "Hello, ini pesan dari admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim",
  "data": {
    "id": 1,
    "pesan": "Hello, ini pesan dari admin",
    "sender": {
      "id": 1,
      "nama": "Admin User",
      "email": "admin@example.com",
      "role": "administrator"
    },
    "sesi": {
      "organisasiType": "programming",
      "status": "ACTIVE"
    },
    "createdAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### 10. List Messages
**GET** `/api/flutter/messages/list?sesiId=1&limit=50&offset=0`

**Query Parameters:**
- `sesiId` (required): Session ID
- `limit` (optional, default: 50): Number of messages per page
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "pesan": "Hello, ini pesan dari admin",
        "sender": {
          "id": 1,
          "nama": "Admin User",
          "email": "admin@example.com",
          "role": "administrator"
        },
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 🔔 Real-time Notifications (Pusher)

### Setup Pusher di Flutter

**pubspec.yaml:**
```yaml
dependencies:
  pusher_channels_flutter: ^2.2.1
```

**Dart Code:**
```dart
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';

final pusher = PusherChannelsFlutter.getInstance();

// Initialize
await pusher.init(
  apiKey: 'YOUR_PUSHER_KEY',
  cluster: 'ap1',
  onEvent: onEvent,
  onSubscriptionSucceeded: onSubscriptionSucceeded,
  onConnectionStateChange: onConnectionStateChange,
);

// Connect
await pusher.connect();

// Subscribe to session channel
await pusher.subscribe(channelName: 'sesi-1');

// Handle events
void onEvent(PusherEvent event) {
  if (event.eventName == 'new-message') {
    final data = jsonDecode(event.data);
    print('New message: ${data['pesan']}');
    // Update UI with new message
  }
}
```

**Event Structure:**
```json
{
  "id": 1,
  "pesan": "Hello from admin",
  "sender": {
    "id": 1,
    "nama": "Admin User",
    "role": "administrator"
  },
  "createdAt": "2024-01-20T10:30:00.000Z",
  "sesi": {
    "organisasiType": "programming",
    "status": "ACTIVE"
  }
}
```

---

## 🚨 Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "message": "Sesi ID wajib diisi"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Sesi wawancara tidak ditemukan"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Terjadi kesalahan server"
}
```

---

## 📦 Flutter Package Requirements

```yaml
dependencies:
  http: ^1.1.0
  dio: ^5.4.0  # Alternative HTTP client
  qr_flutter: ^4.1.0  # QR code generation
  geolocator: ^11.0.0  # Location tracking
  pusher_channels_flutter: ^2.2.1  # Real-time notifications
  permission_handler: ^11.2.0  # Handle permissions
  image_gallery_saver: ^2.0.3  # Save QR to gallery
```

---

## 🔐 Environment Variables (Vercel)

Tambahkan di Vercel dashboard:

```env
# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# JWT Secret
JWT_SECRET=your_secret_key

# Pusher (untuk real-time notifications)
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 🚀 Deploy ke Vercel

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy!

Vercel otomatis detect Next.js dan setup serverless functions untuk API routes.

---

## 📱 Flutter Complete Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://your-domain.vercel.app/api/flutter';
  String? _token;

  // Login
  Future<void> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _token = data['data']['token'];
    }
  }

  // Generate QR
  Future<Map<String, dynamic>> generateQR(int sesiId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/qr/generate'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: jsonEncode({
        'sesiId': sesiId,
        'validHours': 24,
      }),
    );

    return jsonDecode(response.body);
  }

  // Send Location
  Future<Map<String, dynamic>> sendLocation(
    int antrianId,
    double latitude,
    double longitude,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/location/send'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: jsonEncode({
        'antrianId': antrianId,
        'latitude': latitude,
        'longitude': longitude,
      }),
    );

    return jsonDecode(response.body);
  }

  // Send Message
  Future<Map<String, dynamic>> sendMessage(
    int sesiId,
    String pesan,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/messages/send'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: jsonEncode({
        'sesiId': sesiId,
        'pesan': pesan,
      }),
    );

    return jsonDecode(response.body);
  }
}
```
