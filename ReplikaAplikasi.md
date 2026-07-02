# 🚀 ReplikaAplikasi.md
**Panduan Lengkap Replikasi Sistem Ekstrakurikuler**  
**Version:** 2.0 Professional Series  
**Last Updated:** 30 Juni 2026  
**Target:** Developer & System Administrator  

---

## 📋 DESKRIPSI SISTEM

**Sistem Ekstrakurikuler** adalah platform manajemen ekstrakurikuler sekolah yang komprehensif dengan fitur:
- **Dynamic Multi-organization support** - Administrator dapat membuat ekstrakurikuler baru secara dinamis
- **Unlimited Organizations** - Tidak terbatas pada 6 eskul, bisa menambah sebanyak yang dibutuhkan
- **Gamification system** (XP, Level, Achievement)
- **Advanced attendance & finance tracking**
- **Interview management system** 
- **Real-time notifications & analytics**
- **Role-based access control (RBAC)**

---

## 🛠️ TECH STACK

### Mobile Frontend (Primary)
- **Flutter** - Cross-platform mobile framework (iOS & Android)
- **Dart** - Programming language for Flutter
- **Flutter Material Design 3** - Modern UI components
- **Provider/Riverpod** - State management
- **Flutter Hooks** - Widget lifecycle management
- **Cached Network Image** - Image caching and loading

### Backend & Database
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication system
- **Firebase Functions** - Serverless cloud functions
- **Firebase Storage** - File and image storage
- **Firebase Cloud Messaging** - Push notifications
- **Firebase Analytics** - App usage analytics

### Web Dashboard (Optional)
- **Flutter Web** - Web version of the app
- **Responsive Design** - Mobile-first responsive layout
- **PWA Support** - Progressive Web App capabilities

### Infrastructure & Services
- **Firebase Hosting** - Static web hosting
- **Firebase Performance** - App performance monitoring
- **Firebase Crashlytics** - Crash reporting
- **Google Cloud Functions** - Backend logic
- **Firebase Security Rules** - Database security

---

## 🏗️ ARSITEKTUR SISTEM

```
📁 Sistem Ekstrakurikuler Flutter/
├── 📁 lib/                    # Main Flutter application
│   ├── 📁 screens/           # UI Screens (Dashboard, Absensi, etc.)
│   ├── 📁 widgets/           # Reusable UI components
│   ├── 📁 models/            # Data models
│   ├── 📁 services/          # Firebase services
│   ├── 📁 providers/         # State management
│   ├── 📁 utils/             # Utility functions
│   └── 📁 constants/         # App constants
├── 📁 android/               # Android-specific code
├── 📁 ios/                   # iOS-specific code  
├── 📁 web/                   # Web-specific code
├── 📁 functions/             # Firebase Cloud Functions
│   ├── 📁 src/               # Function source code
│   └── package.json          # Function dependencies
├── 📁 firestore.rules        # Database security rules
├── 📁 storage.rules          # Storage security rules
└── 📁 firebase.json          # Firebase configuration
```

---

## 🔧 INSTALASI & SETUP

### Prerequisites
```bash
- Flutter SDK 3.10+
- Dart 3.0+
- Firebase CLI
- Android Studio / VS Code
- Xcode (untuk iOS development)
- Git
```

### Development Tools
- **Android Studio** - IDE untuk Android development
- **VS Code** - Lightweight editor dengan Flutter extension
- **Firebase Console** - Database dan services management
- **FlutterFire CLI** - Firebase configuration for Flutter

### 1. Clone & Setup Flutter Project
```bash
# Clone repository
git clone <repository-url>
cd sistem-ekstrakurikuler-flutter

# Install Flutter dependencies
flutter pub get

# Check Flutter doctor
flutter doctor
```

### 2. Firebase Setup

#### Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new Firebase project
firebase projects:create ekstrakurikuler-app

# Initialize Firebase in project
firebase init
```

#### Configure Firebase for Flutter
```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for Flutter
flutterfire configure
```

### 3. Environment Setup

#### Firebase Configuration
Setelah menjalankan `flutterfire configure`, file berikut akan dibuat:

```dart
// lib/firebase_options.dart (Auto-generated)
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('DefaultFirebaseOptions not supported for this platform.');
    }
  }
  
  // Platform-specific configurations...
}
```

#### App Environment Variables
```dart
// lib/config/app_config.dart
class AppConfig {
  static const String appName = 'Sistem Ekstrakurikuler';
  static const String version = '2.0.0';
  static const bool isDevelopment = true;
  
  // Firebase Collections
  static const String usersCollection = 'users';
  static const String organizationsCollection = 'organizations';
  static const String membersCollection = 'members';
  static const String attendanceCollection = 'attendance';
  static const String expLogsCollection = 'expLogs';
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxItemsPerPage = 50;
  
  // Cache settings
  static const Duration cacheExpiration = Duration(minutes: 30);
}
```

### 4. Dependencies Setup

#### Add Flutter Dependencies
```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  firebase_storage: ^11.5.6
  firebase_messaging: ^14.7.10
  firebase_analytics: ^10.7.4
  firebase_crashlytics: ^3.4.8
  
  # State Management
  provider: ^6.1.1
  riverpod: ^2.4.9
  flutter_riverpod: ^2.4.9
  
  # UI & Navigation
  go_router: ^12.1.3
  flutter_screenutil: ^5.9.0
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  flutter_staggered_grid_view: ^0.7.0
  
  # Utilities
  intl: ^0.19.0
  shared_preferences: ^2.2.2
  connectivity_plus: ^5.0.2
  permission_handler: ^11.2.0
  image_picker: ^1.0.4
  
  # Charts & Graphs
  fl_chart: ^0.66.0
  syncfusion_flutter_charts: ^24.1.41
  
  # QR Code
  qr_flutter: ^4.1.0
  qr_code_scanner: ^1.0.1
  
  # Notifications
  flutter_local_notifications: ^16.3.2
  
  # HTTP & Networking
  http: ^1.1.2
  dio: ^5.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.7
  json_annotation: ^4.8.1
  json_serializable: ^6.7.1
```

#### Install Dependencies
```bash
flutter pub get
flutter pub deps
```

### 5. Firebase Configuration

#### Initialize Firebase in Flutter App
```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(ProviderScope(child: EkstrakurikulerApp()));
}

class EkstrakurikulerApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Sistem Ekstrakurikuler',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      routerConfig: AppRouter.router,
    );
  }
}
```

#### Setup Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentication required for all operations
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPER_ADMIN';
    }
    
    // Check if user is admin of specific organization
    function isOrgAdmin(orgId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/organizationAdmins/$(request.auth.uid + '_' + orgId));
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && 
                         (request.auth.uid == userId || isSuperAdmin());
    }
    
    // Organizations collection
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
      
      // Members subcollection
      match /members/{memberId} {
        allow read, write: if isAuthenticated() && 
                          (isOrgAdmin(orgId) || isSuperAdmin());
      }
      
      // Attendance subcollection
      match /attendance/{attendanceId} {
        allow read, write: if isAuthenticated() && 
                          (isOrgAdmin(orgId) || isSuperAdmin());
      }
      
      // Cash transactions subcollection
      match /cashTransactions/{transactionId} {
        allow read, write: if isAuthenticated() && 
                          (isOrgAdmin(orgId) || isSuperAdmin());
      }
      
      // Experience logs subcollection
      match /expLogs/{expLogId} {
        allow read, write: if isAuthenticated() && 
                          (isOrgAdmin(orgId) || isSuperAdmin());
      }
    }
    
    // Organization admins collection
    match /organizationAdmins/{adminId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    // Achievements collection
    match /achievements/{achievementId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    // Activity logs
    match /logAktivitas/{logId} {
      allow read: if isAuthenticated() && isSuperAdmin();
      allow write: if isAuthenticated();
    }
  }
}
```

### 6. Build & Run

#### Development Mode
```bash
# Run on Android emulator/device
flutter run

# Run on iOS simulator/device  
flutter run -d ios

# Run on web
flutter run -d web-server --web-port 8080

# Run with hot reload
flutter run --hot
```

#### Production Build
```bash
# Build APK for Android
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release

# Build iOS app
flutter build ios --release

# Build web app
flutter build web --release

# Build for all platforms
flutter build apk --release && flutter build ios --release && flutter build web --release
```

---

## 📊 DATABASE SCHEMA

### PostgreSQL Schema (Relational)
#### Core Tables
```sql
-- Users & Authentication
users              # User accounts & roles
organization_admins # User-organization relationships

-- Organizations
organizations      # Ekstrakurikuler organizations
members           # Organization members

-- Attendance & Finance
attendance        # Daily attendance records
cash_transactions # Financial transactions
cash_expenses     # Expense tracking

-- Gamification
exp_logs          # Experience point logs
achievements      # Achievement definitions
member_achievements # User achievements

-- Communication
log_aktivitas     # Activity audit logs
email_logs       # Email communication logs

-- Interview System (OSIS/MPK)
interview_sessions # Interview sessions
interview_queue   # Interview queue management
interview_results # Interview outcomes
```

### Firestore Schema (NoSQL)
#### Collection Structure
```javascript
// Collections in Firestore
{
  // User management
  "users": {
    "[userId]": {
      nama: string,
      email: string,
      role: string,
      created_at: timestamp,
      orgIds: array
    }
  },
  
  // Organization management  
  "organizations": {
    "[orgId]": {
      nama: string,
      slug: string,
      category: string,
      status: string,
      created_at: timestamp
    }
  },
  
  // Organization admins (subcollection or separate)
  "organizationAdmins": {
    "[userId_orgId]": {
      user_id: string,
      organization_id: string,
      created_at: timestamp
    }
  },
  
  // Members per organization
  "organizations/[orgId]/members": {
    "[memberId]": {
      name: string,
      email: string,
      class: string,
      level: number,
      exp: number,
      status: string
    }
  },
  
  // Attendance records
  "organizations/[orgId]/attendance": {
    "[attendanceId]": {
      member_id: string,
      date: timestamp,
      status: string,
      cash_amount: number,
      notes: string
    }
  },
  
  // Financial transactions
  "organizations/[orgId]/cashTransactions": {
    "[transactionId]": {
      member_id: string,
      amount: number,
      description: string,
      type: string,
      created_at: timestamp
    }
  },
  
  // Experience logs
  "organizations/[orgId]/expLogs": {
    "[expLogId]": {
      member_id: string,
      amount: number,
      reason: string,
      given_by: string,
      created_at: timestamp
    }
  },
  
  // Achievements
  "achievements": {
    "[achievementId]": {
      nama_pencapaian: string,
      deskripsi: string,
      exp_reward: number,
      icon: string,
      organization_id: string
    }
  },
  
  // Activity logs
  "logAktivitas": {
    "[logId]": {
      user_id: string,
      user_nama: string,
      aksi: string,
      tabel: string,
      deskripsi: string,
      organization_id: string,
      created_at: timestamp
    }
  }
}
```

### Database Abstraction Layer
```typescript
// lib/database.ts
interface DatabaseAdapter {
  // User operations
  createUser(data: UserData): Promise<User>
  findUser(id: string): Promise<User | null>
  updateUser(id: string, data: Partial<UserData>): Promise<User>
  
  // Organization operations
  createOrganization(data: OrgData): Promise<Organization>
  findOrganizations(filters?: any): Promise<Organization[]>
  
  // Member operations
  createMember(orgId: string, data: MemberData): Promise<Member>
  findMembers(orgId: string, filters?: any): Promise<Member[]>
}

// PostgreSQL implementation
export class PostgreSQLAdapter implements DatabaseAdapter {
  async createUser(data: UserData) {
    return await prisma.user.create({ data })
  }
  // ... other methods
}

// Firestore implementation
export class FirestoreAdapter implements DatabaseAdapter {
  async createUser(data: UserData) {
    const docRef = db.collection('users').doc()
    await docRef.set({ ...data, created_at: new Date() })
    return { id: docRef.id, ...data }
  }
  // ... other methods
}

// Factory pattern
export function createDatabaseAdapter(): DatabaseAdapter {
  const dbType = process.env.DATABASE_TYPE
  
  if (dbType === 'firestore') {
    return new FirestoreAdapter()
  } else {
    return new PostgreSQLAdapter()
  }
}
```

### Relationships
```
Users (1:N) OrganizationAdmins (N:1) Organizations
Organizations (1:N) Members
Members (1:N) Attendance
Members (1:N) CashTransactions
Members (1:N) ExpLogs
```

---

## 🎯 FITUR UTAMA & IMPLEMENTASI

### 1. Dynamic Multi-Organization Support
```dart
// lib/services/organization_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class OrganizationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Validate organization access
  Future<bool> validateOrganizationAccess(
    String userId, 
    String organizationId
  ) async {
    try {
      // Check if user is super admin
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (userDoc.data()?['role'] == 'SUPER_ADMIN') return true;
      
      // Check organization admin relationship
      final adminDoc = await _firestore
          .collection('organizationAdmins')
          .doc('${userId}_$organizationId')
          .get();
          
      return adminDoc.exists;
    } catch (e) {
      return false;
    }
  }
  
  // Administrator dapat membuat organisasi baru
  Future<String> createOrganization({
    required String nama,
    required String category,
    String? deskripsi,
    String? tipe,
  }) async {
    final slug = nama.toLowerCase().replaceAll(' ', '_');
    
    final docRef = await _firestore.collection('organizations').add({
      'nama': nama,
      'slug': slug,
      'category': category,
      'tipe': tipe,
      'deskripsi': deskripsi,
      'status': 'Aktif',
      'school_origin': 'SMK Airlangga',
      'created_at': FieldValue.serverTimestamp(),
    });
    
    return docRef.id;
  }
  
  // Get organizations with real-time updates
  Stream<List<Organization>> getOrganizations() {
    return _firestore
        .collection('organizations')
        .where('status', isEqualTo: 'Aktif')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Organization.fromFirestore(doc))
            .toList());
  }
}
```

### 2. Firebase Authentication Integration
```dart
// lib/services/auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  User? get currentUser => _auth.currentUser;
  
  // Login dengan email dan password
  Future<UserCredential?> signInWithEmailAndPassword(
    String email, 
    String password
  ) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update last login
      await _firestore
          .collection('users')
          .doc(credential.user!.uid)
          .update({
        'last_login': FieldValue.serverTimestamp(),
      });
      
      return credential;
    } catch (e) {
      throw e;
    }
  }
  
  // Register new user
  Future<UserCredential?> registerWithEmailAndPassword(
    String email, 
    String password,
    String nama,
    String role
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Create user document in Firestore
      await _firestore
          .collection('users')
          .doc(credential.user!.uid)
          .set({
        'nama': nama,
        'email': email,
        'role': role,
        'created_at': FieldValue.serverTimestamp(),
        'orgIds': [],
      });
      
      return credential;
    } catch (e) {
      throw e;
    }
  }
  
  // Auto-refresh dengan Firebase Auth
  Stream<User?> get authStateChanges => _auth.authStateChanges();
}
```

### 3. State Management dengan Riverpod
```dart
// lib/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authStateProvider = StreamProvider<User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

final currentUserProvider = FutureProvider<AppUser?>((ref) async {
  final authState = ref.watch(authStateProvider);
  return authState.when(
    data: (user) async {
      if (user == null) return null;
      return await UserService().getUserData(user.uid);
    },
    loading: () => null,
    error: (_, __) => null,
  );
});

// Organization state management
final activeOrganizationProvider = StateProvider<String?>((ref) => null);

final organizationListProvider = StreamProvider<List<Organization>>((ref) {
  return OrganizationService().getOrganizations();
});
```

### 4. Real-time Updates dengan Firestore Streams
```dart
// lib/services/attendance_service.dart
class AttendanceService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Real-time attendance stream
  Stream<List<Attendance>> getAttendanceStream(
    String organizationId, {
    DateTime? date,
  }) {
    Query query = _firestore
        .collection('organizations')
        .doc(organizationId)
        .collection('attendance')
        .orderBy('created_at', descending: true);
        
    if (date != null) {
      final startOfDay = DateTime(date.year, date.month, date.day);
      final endOfDay = startOfDay.add(Duration(days: 1));
      
      query = query
          .where('date', isGreaterThanOrEqualTo: startOfDay)
          .where('date', isLessThan: endOfDay);
    }
    
    return query.snapshots().map((snapshot) =>
        snapshot.docs
            .map((doc) => Attendance.fromFirestore(doc))
            .toList());
  }
  
  // Bulk attendance input dengan batch writes
  Future<void> submitBulkAttendance(
    String organizationId,
    List<AttendanceRecord> records,
  ) async {
    final batch = _firestore.batch();
    final attendanceCollection = _firestore
        .collection('organizations')
        .doc(organizationId)
        .collection('attendance');
    
    for (final record in records) {
      final docRef = attendanceCollection.doc();
      batch.set(docRef, {
        ...record.toMap(),
        'organization_id': organizationId,
        'created_at': FieldValue.serverTimestamp(),
      });
    }
    
    await batch.commit();
  }
}
```

### 5. Offline Support & Caching
```dart
// lib/services/offline_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class OfflineService {
  static const String _cachePrefix = 'cache_';
  
  // Cache data for offline access
  Future<void> cacheData(String key, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = jsonEncode(data);
    await prefs.setString('$_cachePrefix$key', jsonString);
  }
  
  // Retrieve cached data
  Future<Map<String, dynamic>?> getCachedData(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString('$_cachePrefix$key');
    
    if (jsonString != null) {
      return jsonDecode(jsonString);
    }
    return null;
  }
  
  // Enable Firestore offline persistence
  Future<void> enableOfflineSupport() async {
    await FirebaseFirestore.instance.enablePersistence();
  }
}
```

---

## 🔐 SECURITY FEATURES

### Firebase Authentication Flow
1. **Login** → Firebase Auth dengan email/password
2. **Token Management** → Firebase handles JWT automatically
3. **Firestore Rules** → Server-side security rules
4. **Organization Isolation** → Collection-level data segregation

### Security Measures
```dart
// lib/services/security_service.dart
class SecurityService {
  // Input validation
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  // Sanitize input
  static String sanitizeInput(String input) {
    return input.replaceAll(RegExp(r'[<>"\';()&+]'), '');
  }
  
  // Rate limiting dengan Firebase Functions
  static Future<bool> checkRateLimit(String userId, String action) async {
    final callable = FirebaseFunctions.instance.httpsCallable('checkRateLimit');
    final result = await callable.call({
      'userId': userId,
      'action': action,
    });
    return result.data['allowed'] ?? false;
  }
}
```

### Firestore Security Rules (Enhanced)
```javascript
// firestore.rules (Advanced Security)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && getUserRole() == 'SUPER_ADMIN';
    }
    
    function isOrgAdmin(orgId) {
      return isAuthenticated() && (
        isSuperAdmin() ||
        exists(/databases/$(database)/documents/organizationAdmins/$(request.auth.uid + '_' + orgId))
      );
    }
    
    // Rate limiting function
    function checkRateLimit(action) {
      let requests = get(/databases/$(database)/documents/rateLimits/$(request.auth.uid)).data[action] ?? [];
      let now = request.time;
      let oneHourAgo = now - duration.value(1, 'h');
      let recentRequests = requests.where('timestamp', '>', oneHourAgo);
      return recentRequests.size() < 100; // Max 100 requests per hour
    }
    
    // Data validation functions
    function isValidEmail(email) {
      return email.matches('^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidOrganizationData(data) {
      return data.keys().hasAll(['nama', 'category', 'status']) &&
             data.nama is string && data.nama.size() > 0 &&
             data.category in ['Ekstrakurikuler', 'OSIS', 'MPK'] &&
             data.status in ['Aktif', 'Nonaktif'];
    }
    
    // Users collection with validation
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || isSuperAdmin()
      );
      allow write: if isAuthenticated() && 
                   request.auth.uid == userId &&
                   checkRateLimit('userUpdate') &&
                   isValidEmail(resource.data.email);
    }
    
    // Organizations with strict validation
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin() && 
                    checkRateLimit('createOrg') &&
                    isValidOrganizationData(request.resource.data);
      allow update: if isSuperAdmin() &&
                    checkRateLimit('updateOrg');
      allow delete: if isSuperAdmin();
      
      // Members with organization isolation
      match /members/{memberId} {
        allow read, write: if isOrgAdmin(orgId) && 
                          checkRateLimit('memberAction');
      }
      
      // Attendance with timestamp validation
      match /attendance/{attendanceId} {
        allow read, write: if isOrgAdmin(orgId) &&
                          checkRateLimit('attendance') &&
                          request.resource.data.date is timestamp;
      }
    }
    
    // Audit logs (write-only for regular users)
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin();
      allow create: if isAuthenticated();
    }
  }
}
```

### Data Encryption & Privacy
```dart
// lib/utils/encryption_util.dart
import 'dart:convert';
import 'package:crypto/crypto.dart';

class EncryptionUtil {
  // Hash sensitive data
  static String hashSensitiveData(String data) {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  // Validate data integrity
  static bool validateDataIntegrity(String data, String hash) {
    return hashSensitiveData(data) == hash;
  }
  
  // Anonymize personal data for analytics
  static Map<String, dynamic> anonymizeUserData(Map<String, dynamic> userData) {
    return {
      'role': userData['role'],
      'created_at': userData['created_at'],
      'organization_count': (userData['orgIds'] as List?)?.length ?? 0,
      // Remove PII
    };
  }
}
```

---

## 📱 FLUTTER WIDGETS & UI COMPONENTS

### Custom UI Components
```dart
// lib/widgets/organization_card.dart
class OrganizationCard extends StatelessWidget {
  final Organization organization;
  final VoidCallback? onTap;
  
  const OrganizationCard({
    Key? key,
    required this.organization,
    this.onTap,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              colors: [
                Theme.of(context).primaryColor.withOpacity(0.1),
                Theme.of(context).primaryColor.withOpacity(0.05),
              ],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor,
                    child: Icon(
                      _getCategoryIcon(organization.category),
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          organization.nama,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          organization.category,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(status: organization.status),
                ],
              ),
              if (organization.deskripsi != null) ...[
                SizedBox(height: 8),
                Text(
                  organization.deskripsi!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
  
  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Ekstrakurikuler': return Icons.groups;
      case 'OSIS': return Icons.school;
      case 'MPK': return Icons.gavel;
      default: return Icons.group;
    }
  }
}
```

### Real-time Data Widgets
```dart
// lib/widgets/attendance_stream_builder.dart
class AttendanceStreamBuilder extends ConsumerWidget {
  final String organizationId;
  final DateTime? selectedDate;
  
  const AttendanceStreamBuilder({
    Key? key,
    required this.organizationId,
    this.selectedDate,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceStream = ref.watch(
      attendanceStreamProvider((organizationId, selectedDate))
    );
    
    return attendanceStream.when(
      data: (attendanceList) => ListView.builder(
        itemCount: attendanceList.length,
        itemBuilder: (context, index) {
          final attendance = attendanceList[index];
          return AttendanceCard(attendance: attendance);
        },
      ),
      loading: () => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading attendance data...'),
          ],
        ),
      ),
      error: (error, stackTrace) => ErrorWidget(
        error: error.toString(),
        onRetry: () => ref.refresh(
          attendanceStreamProvider((organizationId, selectedDate))
        ),
      ),
    );
  }
}
```

### Responsive Design Components
```dart
// lib/widgets/responsive_layout.dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  
  const ResponsiveLayout({
    Key? key,
    required this.mobile,
    this.tablet,
    this.desktop,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1200) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= 800) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}

// Usage example
class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ResponsiveLayout(
      mobile: MobileDashboard(),
      tablet: TabletDashboard(),
      desktop: DesktopDashboard(),
    );
  }
}
```

## 📱 FIREBASE CLOUD FUNCTIONS (Backend Logic)

### Authentication Functions
```javascript
// functions/src/auth.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Custom claims untuk role management
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify admin permissions
  if (!context.auth || !await isAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user roles.'
    );
  }
  
  const { uid, role } = data;
  
  // Set custom claims
  await admin.auth().setCustomUserClaims(uid, { role });
  
  // Update Firestore user document
  await admin.firestore().collection('users').doc(uid).update({
    role: role,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// Rate limiting function
exports.checkRateLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { userId, action } = data;
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(userId);
  
  const doc = await rateLimitRef.get();
  const now = admin.firestore.Timestamp.now();
  const oneHourAgo = new admin.firestore.Timestamp(now.seconds - 3600, now.nanoseconds);
  
  let requests = doc.exists ? doc.data()[action] || [] : [];
  
  // Filter recent requests
  requests = requests.filter(req => req.timestamp.seconds > oneHourAgo.seconds);
  
  if (requests.length >= 100) {
    return { allowed: false, message: 'Rate limit exceeded' };
  }
  
  // Add current request
  requests.push({ timestamp: now });
  
  await rateLimitRef.set({
    [action]: requests
  }, { merge: true });
  
  return { allowed: true };
});
```

### Data Processing Functions
```javascript
// functions/src/attendance.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Process bulk attendance with XP calculation
exports.processBulkAttendance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  const { organizationId, attendanceRecords } = data;
  const batch = admin.firestore().batch();
  
  // Validate organization access
  const hasAccess = await validateOrganizationAccess(context.auth.uid, organizationId);
  if (!hasAccess) {
    throw new functions.https.HttpsError('permission-denied', 'No access to organization');
  }
  
  for (const record of attendanceRecords) {
    // Create attendance record
    const attendanceRef = admin.firestore()
      .collection('organizations').doc(organizationId)
      .collection('attendance').doc();
    
    batch.set(attendanceRef, {
      ...record,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Calculate and update XP
    const xpChange = calculateAttendanceXP(record.status);
    if (xpChange !== 0) {
      const memberRef = admin.firestore()
        .collection('organizations').doc(organizationId)
        .collection('members').doc(record.memberId);
      
      batch.update(memberRef, {
        exp: admin.firestore.FieldValue.increment(xpChange),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Log XP change
      const expLogRef = admin.firestore()
        .collection('organizations').doc(organizationId)
        .collection('expLogs').doc();
      
      batch.set(expLogRef, {
        member_id: record.memberId,
        amount: xpChange,
        reason: `Attendance: ${record.status}`,
        given_by: context.auth.uid,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  
  await batch.commit();
  return { success: true, processed: attendanceRecords.length };
});

function calculateAttendanceXP(status) {
  switch (status) {
    case 'hadir': return 10;
    case 'alpa': return -10;
    default: return 0;
  }
}
```

### Notification Functions
```javascript
// functions/src/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Send push notifications
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { title, body, tokens, data: notificationData } = data;
  
  if (!context.auth || !await isAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const message = {
    notification: { title, body },
    data: notificationData || {},
    tokens: tokens,
  };
  
  const response = await admin.messaging().sendMulticast(message);
  
  // Log notification
  await admin.firestore().collection('notificationLogs').add({
    title,
    body,
    sent_to: tokens.length,
    success_count: response.successCount,
    failure_count: response.failureCount,
    sent_by: context.auth.uid,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return {
    success: true,
    successCount: response.successCount,
    failureCount: response.failureCount
  };
});

// Trigger on organization creation
exports.onOrganizationCreated = functions.firestore
  .document('organizations/{orgId}')
  .onCreate(async (snap, context) => {
    const orgData = snap.data();
    const orgId = context.params.orgId;
    
    // Create default achievements
    const defaultAchievements = [
      {
        nama_pencapaian: 'First Member',
        deskripsi: `First member of ${orgData.nama}`,
        exp_reward: 100,
        icon: 'star',
        organization_id: orgId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        nama_pencapaian: 'Perfect Attendance',
        deskripsi: 'Attend 10 consecutive meetings',
        exp_reward: 250,
        icon: 'trophy',
        organization_id: orgId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }
    ];
    
    const batch = admin.firestore().batch();
    defaultAchievements.forEach(achievement => {
      const achievementRef = admin.firestore().collection('achievements').doc();
      batch.set(achievementRef, achievement);
    });
    
    await batch.commit();
    
    console.log(`Default achievements created for organization: ${orgData.nama}`);
  });
```

---

## 🚀 DEPLOYMENT GUIDE

### 1. Firebase Hosting Deployment
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build Flutter web app
flutter build web --release

# Initialize Firebase hosting
firebase init hosting

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Set custom domain (optional)
firebase hosting:channel:deploy production --expires 30d
```

### 2. Google Play Store Deployment
```bash
# Build App Bundle for Play Store
flutter build appbundle --release

# Upload to Google Play Console
# 1. Go to Google Play Console
# 2. Create new app or select existing
# 3. Upload the .aab file from build/app/outputs/bundle/release/
# 4. Fill in store listing details
# 5. Submit for review
```

### 3. Apple App Store Deployment
```bash
# Build iOS app
flutter build ios --release

# Open Xcode
open ios/Runner.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product -> Archive
# 3. Upload to App Store Connect
# 4. Submit for review in App Store Connect
```

### 4. Firebase Cloud Functions Deployment
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName
```

---

## 🔧 CUSTOMIZATION GUIDE

### 1. Menambah Role Baru
```dart
// lib/models/user_role.dart
enum UserRole {
  superAdmin('SUPER_ADMIN'),
  orgAdmin('ORG_ADMIN'),
  customRole('CUSTOM_ROLE'), // Role baru
  ;
  
  const UserRole(this.value);
  final String value;
  
  static UserRole fromString(String role) {
    return UserRole.values.firstWhere(
      (r) => r.value == role,
      orElse: () => UserRole.orgAdmin,
    );
  }
}

// lib/services/permission_service.dart
class PermissionService {
  static bool canAccessCustomFeature(UserRole role) {
    return role == UserRole.customRole || 
           role == UserRole.superAdmin;
  }
  
  static bool hasCustomPermission(UserRole role, String permission) {
    final rolePermissions = {
      UserRole.customRole: ['read_custom', 'write_custom'],
      UserRole.superAdmin: ['*'], // All permissions
    };
    
    return rolePermissions[role]?.contains(permission) ?? false ||
           rolePermissions[role]?.contains('*') ?? false;
  }
}
```

### 2. Menambah Organisasi Baru (Dynamic Creation)
```dart
// lib/screens/admin/create_organization_screen.dart
class CreateOrganizationScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text('Create Organization')),
      body: OrganizationForm(
        onSubmit: (organizationData) async {
          // Validate data
          if (organizationData.nama.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Organization name is required'))
            );
            return;
          }
          
          try {
            // Create organization via service
            final orgService = ref.read(organizationServiceProvider);
            final orgId = await orgService.createOrganization(
              nama: organizationData.nama,
              category: organizationData.category,
              deskripsi: organizationData.deskripsi,
              tipe: organizationData.tipe,
            );
            
            // Auto-assign creator as admin
            await orgService.assignAdmin(
              organizationId: orgId,
              userId: FirebaseAuth.instance.currentUser!.uid,
            );
            
            // Navigate back with success message
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Organization created successfully!'))
            );
            
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: ${e.toString()}'))
            );
          }
        },
      ),
    );
  }
}

// Auto-generate default settings
Future<void> setupNewOrganization(String orgId, String orgName) async {
  final batch = FirebaseFirestore.instance.batch();
  
  // Create default settings
  final settingsRef = FirebaseFirestore.instance
      .collection('organizations')
      .doc(orgId)
      .collection('settings')
      .doc('general');
  
  batch.set(settingsRef, {
    'attendance_xp': 10,
    'absence_penalty': -10,
    'max_members': 50,
    'meeting_day': 'Friday',
    'meeting_time': '14:00',
    'created_at': FieldValue.serverTimestamp(),
  });
  
  // Create default achievement categories
  final achievementCategories = [
    'Attendance', 'Participation', 'Leadership', 'Achievement'
  ];
  
  for (String category in achievementCategories) {
    final categoryRef = FirebaseFirestore.instance
        .collection('organizations')
        .doc(orgId)
        .collection('achievementCategories')
        .doc();
    
    batch.set(categoryRef, {
      'name': category,
      'description': 'Default $category category',
      'created_at': FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
}
```

### 3. Dynamic Theme System
```dart
// lib/config/app_themes.dart
class AppThemes {
  static ThemeData getLightTheme(String organizationSlug) {
    final colorScheme = _getOrganizationColors(organizationSlug);
    
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
  
  static ColorScheme _getOrganizationColors(String organizationSlug) {
    final organizationColors = {
      'programming': ColorScheme.fromSeed(seedColor: Colors.blue),
      'english': ColorScheme.fromSeed(seedColor: Colors.green),
      'osis': ColorScheme.fromSeed(seedColor: Colors.orange),
      'mpk': ColorScheme.fromSeed(seedColor: Colors.purple),
      'robotics': ColorScheme.fromSeed(seedColor: Colors.red),
      'basketball': ColorScheme.fromSeed(seedColor: Colors.brown),
    };
    
    return organizationColors[organizationSlug] ??
           ColorScheme.fromSeed(seedColor: Colors.deepPurple);
  }
}

// Usage in main app
class EkstrakurikulerApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeOrg = ref.watch(activeOrganizationProvider);
    final orgSlug = activeOrg?.slug ?? 'default';
    
    return MaterialApp.router(
      title: 'Sistem Ekstrakurikuler',
      theme: AppThemes.getLightTheme(orgSlug),
      darkTheme: AppThemes.getDarkTheme(orgSlug),
      routerConfig: AppRouter.router,
    );
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Common Issues

#### 1. Database Connection Error

**PostgreSQL:**
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

**Firebase Firestore:**
```bash
# Check Firebase configuration
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Test Firestore connection
node -e "
const { db } = require('./lib/firebase');
db.collection('test').doc('connection').set({test: true})
  .then(() => console.log('Firestore connected!'))
  .catch(console.error);
"

# Initialize Firestore collections
npm run firestore:init
```

#### 2. Build Memory Issues
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or use package.json script
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

#### 3. Session Issues
```bash
# Clear all sessions
redis-cli FLUSHALL

# Check JWT secret
echo $JWT_SECRET | wc -c  # Should be > 32 characters
```

#### 4. Permission Errors
```typescript
// Debug user permissions
console.log('User role:', session.role)
console.log('Org IDs:', session.orgIds)
console.log('Active Org:', session.activeOrgId)
```

---

## 📋 MAINTENANCE CHECKLIST

### Daily
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Verify backup status

### Weekly
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Performance analysis

### Monthly
- [ ] Database cleanup
- [ ] Security audit
- [ ] Feature usage analytics

---

## 📞 SUPPORT & RESOURCES

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- **Discord:** [Link ke server Discord]
- **GitHub Issues:** [Link ke repository issues]
- **Documentation Wiki:** [Link ke wiki]

### Professional Support
- **Email:** support@ekstrakurikuler.app
- **WhatsApp:** +62-XXX-XXXX-XXXX
- **Consultation:** Tersedia konsultasi teknis berbayar

---

## 📄 LICENSE & CREDITS

**License:** MIT License  
**Created by:** [Nama Developer/Team]  
**Contributors:** [Daftar kontributor]  
**Special Thanks:** Next.js team, Prisma team, Vercel

---

*Sistem ini telah dioptimalkan untuk performa, keamanan, dan skalabilitas. Untuk implementasi di production, pastikan mengikuti semua security best practices dan melakukan testing menyeluruh.*