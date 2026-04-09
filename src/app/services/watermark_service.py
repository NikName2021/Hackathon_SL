import os
from PIL import Image
from pypdf import PdfReader, PdfWriter
from core.config import logger

class WatermarkService:
    @staticmethod
    def _str_to_bin(data):
        """Convert string to binary."""
        return ''.join(format(ord(i), '08b') for i in data)

    @staticmethod
    def apply_watermark(file_path: str, cipher: str):
        """
        Detects file type and applies appropriate invisible watermark (LSB for images, Metadata for PDF).
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext in ['.png', '.jpg', '.jpeg']:
                return WatermarkService.apply_image_watermark(file_path, cipher)
            elif ext == '.pdf':
                return WatermarkService.apply_pdf_watermark(file_path, cipher)
            else:
                # For other files, we just append to metadata if possible or skip
                logger.warning(f"Watermarking not supported for extension: {ext}")
                return False
        except Exception as e:
            logger.error(f"Failed to apply watermark to {file_path}: {e}")
            return False

    @staticmethod
    def apply_image_watermark(file_path: str, cipher: str):
        """
        Applies LSB (Least Significant Bit) steganography to the image.
        Note: Works best with PNG. For JPEG, re-compression might destroy it, 
        but we'll apply it anyway as requested.
        """
        # Add a delimiter to know where the message ends
        secret_data = cipher + "###" 
        binary_data = WatermarkService._str_to_bin(secret_data)
        data_len = len(binary_data)
        
        img = Image.open(file_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        pixels = img.load()
        width, height = img.size
        
        data_index = 0
        for y in range(height):
            for x in range(width):
                if data_index < data_len:
                    r, g, b = pixels[x, y]
                    # Modify the last bit of the Red channel
                    new_r = (r & ~1) | int(binary_data[data_index])
                    pixels[x, y] = (new_r, g, b)
                    data_index += 1
                else:
                    break
            if data_index >= data_len:
                break
        
        # Save the watermarked image (PNG is preferred to avoid compression loss)
        # If it was a JPG, saving it again as JPG might destroy it, 
        # but for this MVP we'll stick to the requested logic.
        img.save(file_path)
        return True

    @staticmethod
    def apply_pdf_watermark(file_path: str, cipher: str):
        """
        Injects the cipher into the PDF metadata 'Subject' field or custom properties.
        """
        reader = PdfReader(file_path)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Add custom metadata (invisible to most users, visible in properties)
        metadata = reader.metadata or {}
        new_metadata = {k: v for k, v in metadata.items()}
        new_metadata["/X-Watermark-Cipher"] = cipher
        
        writer.add_metadata(new_metadata)

        with open(file_path, "wb") as f:
            writer.write(f)
        
        return True
