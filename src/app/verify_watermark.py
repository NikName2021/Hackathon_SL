import sys
import os
sys.path.append(os.getcwd())

from services.watermark_service import WatermarkService
from PIL import Image
import io

def test_image_watermark():
    # Create a small dummy image
    img = Image.new('RGB', (100, 100), color=(73, 109, 137))
    test_path = "test_watermark.png"
    img.save(test_path)
    
    cipher = "SECURE-123456"
    print(f"Applying watermark: {cipher}")
    success = WatermarkService.apply_image_watermark(test_path, cipher)
    print(f"Success: {success}")
    
    # Try to verify (manual LSB extraction)
    img_after = Image.open(test_path)
    pixels = img_after.load()
    
    extracted_bin = ""
    # We hidden cipher + "###" which is 13+3=16 chars = 16*8 bits = 128 bits
    for i in range(128):
        x = i % 100
        y = i // 100
        r, g, b = pixels[x, y]
        extracted_bin += str(r & 1)
    
    def decode_binary(binary):
        chars = [binary[i:i+8] for i in range(0, len(binary), 8)]
        return "".join([chr(int(c, 2)) for c in chars])
    
    extracted_text = decode_binary(extracted_bin)
    print(f"Extracted binary trace: {extracted_text}")
    
    if cipher in extracted_text:
        print("VERIFICATION SUCCESSFUL: Cipher found in image pixels!")
    else:
        print("VERIFICATION FAILED: Cipher not found.")
    
    os.remove(test_path)

if __name__ == "__main__":
    test_image_watermark()
