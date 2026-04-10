import base64
import hashlib
from cryptography.fernet import Fernet
from core.config import SECRET_KEY

# Generate a valid Fernet key from the app's secret key
# We take a SHA256 hash of the secret key and encode it in base64
key_material = str(SECRET_KEY).encode()
key_hash = hashlib.sha256(key_material).digest()
FERNET_KEY = base64.urlsafe_b64encode(key_hash)
cipher_suite = Fernet(FERNET_KEY)

class EncryptionService:
    @staticmethod
    def encrypt_message(text: str) -> str:
        if not text:
            return text
        try:
            encrypted_text = cipher_suite.encrypt(text.encode())
            return encrypted_text.decode()
        except Exception as e:
            # Fallback to original text if encryption fails
            return text

    @staticmethod
    def decrypt_message(encrypted_text: str) -> str:
        if not encrypted_text:
            return encrypted_text
        try:
            decrypted_text = cipher_suite.decrypt(encrypted_text.encode())
            return decrypted_text.decode()
        except Exception:
            # If decryption fails (e.g. it's an old unencrypted message), return as is
            return encrypted_text
