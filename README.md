# Design Doc

## Proposal

This project aims to develop a personal and small team file storage service similar to **Google Drive or Dropbox.** The service will allow users to upload images and videos, share files with other users, manage permissions, and ensure the security of their data through end-to-end encryption (E2EE).


## Requirements

### Must Have

* User Authentication via OAuth.
* Upload and Download for various forms of media files.
* File sharing and permission management.
* E2EE for file storage and transfer.
* private key recovery mechanism
* User-friendly UI.

### Should Have

* Basic logging and monitoring.
* Notifications for shared files and permission changes.
* File versioning.

### Won’t Have

* Advanced analytics and reporting.
* Complex workflow automation.



## Technical Overview

### Tech Stack

* React.js for UI development.
* Node.js + Express.js for backend development using TypeScript.
* RabbitMQ as a message broker.
* PostgreSql for users, metadata, and permissions storage.
* MinIO for object storage.
* Docker for containerization of the different microservices.
* Kubernetes for orchestration of the different Docker containers.
* OAuth for authentication.
* GitHub Actions for CI/CD workflow.
* Digital Ocean for deployment.

### Microservices

The system will use a message broker (RabbitMQ) for asynchronous communication between microservices. Each service will publish messages to specific queues, which other services will consume and process.

The primary components of the system will include:

1. Authentication Service: Handles user authentication using OAuth.
2. File Service: Manages file uploads, downloads, and storage with E2EE.
3. Sharing Service: Manages file sharing and permissions.
4. Metadata Service: Handles metadata storage and retrieval using PostgreSQL.
5. Notification Service: Manages notifications for file sharing and permission changes.



### Microservices communication

Communication will be facilitated in asynchronous manner using EDA (event-driven architecture) due to possibility of upload and download of large files by users. Below is the proposed list of event publishers and listeners.

**Authentication Service**

Publisher:

    * None

Listener:

    * None

**File Service**

Publisher:

    * FileUploadEvent: Published when a file is uploaded
        * Event data: `{ fileId, userId, fileName, filePath }`
    * FileDownloadRequest: Published when a file download is requested
        * Event data: `{ fileId, userId }`

Listener:

    * FileEncryptedEvent: Consumed when a file encryption is completed
        * Event data: `{ fileId, encryptedFilePath }`
    * FileDecryptedEvent: Consumed when a file decryption is completed
        * Event data: `{ fileId, decryptedFilePath }`

**Sharing Service**

Publisher:

    * FileSharedEvent: Published when a file is shared with a user
        * Event data: `{ fileId, ownerId, sharedWithUserId, permission }`
    * PermissionChangedEvent: Published when file permissions are changed
        * Event data: `{ fileId, ownerId, sharedWithUserId, newPermission }`

Listener:

    * FileUploadEvent: Consumed to handle post-upload operations like sharing
        * Event data: `{ fileId, userId, fileName, filePath }`

**Metadata Service**

Publisher:

    * MetadataUpdatedEvent: Published when metadata is updated
        * Event data: `{ fileId, metadata }`

Listener:

    * FileUploadEvent: Consumed to create initial metadata for uploaded files
        * Event data: `{ fileId, userId, fileName, filePath }`
    * FileSharedEvent: Consumed to update metadata when a file is shared
        * Event data: `{ fileId, ownerId, sharedWithUserId, permission }`
    * PermissionChangedEvent: Consumed to update metadata when permissions are changed
        * Event data: `{ fileId, ownerId, sharedWithUserId, newPermission }`

**Notification Service**

Publisher:

    * NotificationSentEvent: Published when a notification is sent
        * Event data: `{ notificationId, userId, message, timestamp }`

Listener:

    * FileSharedEvent: Consumed to send notifications about shared files
        * Event data: `{ fileId, ownerId, sharedWithUserId, permission }`
    * PermissionChangedEvent: Consumed to send notifications about permission changes
        * Event data: `{ fileId, ownerId, sharedWithUserId, newPermission }`

**Encryption Service**

Publisher:

    * FileEncryptedEvent: Published when a file is encrypted
        * Event data: `{ fileId, encryptedFilePath }`
    * FileDecryptedEvent: Published when a file is decrypted
        * Event data: `{ fileId, decryptedFilePath }`

Listener:

    * FileUploadEvent: Consumed to initiate file encryption
        * Event data: `{ fileId, userId, fileName, filePath }`
    * FileDownloadRequest: Consumed to initiate file decryption
        * Event data: `{ fileId, userId }`



### UML diagram

![Image](https://github.com/EminMammadzada/ThrowBox/assets/74462948/84c994dd-43d8-4129-8666-c1c79c739ed9)


### PostgreSql Schema

```
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    oauth_provider VARCHAR(50) NOT NULL, -- OAuth provider
    oauth_id VARCHAR(255) NOT NULL, -- OAuth unique user ID
    public_key BYTEA NOT NULL, -- Public key stored in plaintext
    encrypted_private_key BYTEA NOT NULL, -- Private key encrypted before storage
    iv BYTEA NOT NULL, -- Initialization vector used for encrypting the private key
    salt BYTEA NOT NULL -- Salt used for key derivation
);

CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    encrypted_symmetric_key BYTEA NOT NULL,
    iv BYTEA NOT NULL, -- Initialization vector used for encrypting the symmetric key
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_shared BOOLEAN DEFAULT FALSE
);

CREATE TABLE shared_files (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    shared_with_user_id INTEGER REFERENCES users(id),
    encrypted_symmetric_key BYTEA NOT NULL,
    iv BYTEA NOT NULL, -- Initialization vector used for encrypting the symmetric key
    permission VARCHAR(50) NOT NULL,
    shared_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```



## Milestones

=== Week 1: Initial Setup, CI/CD Pipeline, and Authentication Service

* Set up development environment (Docker, Kubernetes, PostgreSQL, RabbitMQ, MinIO).
* Set up CI/CD pipeline using GitHub Actions.
* Implement and containerize the Authentication Service.
* Integrate OAuth providers (e.g., Google, Facebook).
* Deploy Authentication Service to Kubernetes.
* Basic unit tests for Authentication Service.
* Start development of the UI for authentication and basic navigation.

=== Week 2: File Service Implementation and UI Integration

* Implement file upload and download endpoints.
* Integrate file encryption and decryption.
* Publish encryption and storage events to RabbitMQ.
* Containerize and deploy File Service.
* Basic unit tests for File Service.
* Integrate file upload and download features in the UI.

=== Week 3: Metadata Service and Database Integration

* Implement CRUD operations for metadata.
* Set up PostgreSQL database schema and migrations.
* Consume metadata update messages from RabbitMQ.
* Containerize and deploy Metadata Service.
* Basic unit tests for Metadata Service.
* Integrate file metadata display in the UI.

=== Week 4: Sharing Service Implementation and UI Integration

* Implement file sharing and permission management endpoints.
* Publish sharing and permission change events to RabbitMQ.
* Update metadata and notify users.
* Containerize and deploy Sharing Service.
* Basic unit tests for Sharing Service.
* Integrate file sharing and permission management features in the UI.

=== Week 5: Notification Service Implementation and UI Integration

* Implement notification endpoints and logic.
* Consume messages from RabbitMQ to trigger notifications.
* Containerize and deploy Notification Service.
* Basic unit tests for Notification Service.
* Integrate notification features in the UI.

=== Week 6: End-to-End Integration and UI Enhancement

* Conduct end-to-end integration tests.
* Enhance UI for better user experience and additional features.
* Address any integration issues between services and UI.

=== Week 7: Comprehensive Testing

* Write comprehensive integration tests for all services.
* Ensure CI/CD pipeline runs all tests and deploys automatically.
* Conduct thorough testing of the entire system, both backend and UI.

=== Week 8: Final Testing and Deployment

* Conduct final testing and bug fixing.
* Deploy the complete system to a production-like environment.
* Prepare project documentation and user guides.



## Miscellaneous

### Key recovery? Why?

Diffie-Hellman key exchange algorithm is a form of asymmetric encryption system, hence, it relies on a pair of public and private keys for encryption and decryption. The user’s private key has to be securely stored on the client-side (e.g. local storage) to ensure that the user can encrypt/decrypt the contents of the files. However, if the user clears the browser local storage, then they might use their private key and won’t be able to use the service. This will also help in the scenario when user may choose to access the application from different browsers. The following steps can be implemented to accommodate that:

_User Registration and Key Generation_

1. OAuth Authentication.
    1. User authenticates using OAuth (e.g., Google, Facebook).
2. Generate RSA Key Pair.
    1. After successful OAuth authentication, generate an RSA key pair (public and private keys) on the client side.
3. Encrypt the Private Key.
    1. Encrypt the private key using a *password-derived key* (PBKDF2 and AES-GCM).
    2. Store the encrypted private key, IV, and salt on the server.


_Secure retrieval mechanism_

1. OAuth Authentication:
    1. User logs in using OAuth and obtains an OAuth token.
2. Retrieve Encrypted Private Key and IV.
    1. Retrieve the encrypted private key, IV, and salt from the server using the OAuth token.
3. Decrypt the Private Key.
    1. Use the user's password to derive the key and decrypt the private key.

